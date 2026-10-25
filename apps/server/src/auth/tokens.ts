import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';
import type { Db } from '../db.js';

export type TokenPair = { accessToken: string; refreshToken: string; expiresIn: number };

const sha256 = (value: string) => createHash('sha256').update(value).digest('base64url');

/** Requests that arrive this soon after a rotation are treated as a race between two app tabs, not as token theft. */
const ROTATION_GRACE_MS = 15_000;

export async function signAccessToken(userId: string, sessionFamily: string) {
  return new SignJWT({ fam: sessionFamily })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer('cliq')
    .setExpirationTime(`${config.accessTokenTtlSeconds}s`)
    .sign(config.jwtSecret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, config.jwtSecret, { issuer: 'cliq', algorithms: ['HS256'] });
  if (!payload.sub) throw new Error('missing subject');
  return { userId: payload.sub, family: String(payload.fam ?? '') };
}

async function insertSession(db: Db, userId: string, familyId: string, userAgent: string): Promise<TokenPair> {
  const refreshToken = randomBytes(32).toString('base64url');
  await db.query(
    `INSERT INTO sessions (user_id, family_id, token_hash, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, now() + make_interval(days => $5))`,
    [userId, familyId, sha256(refreshToken), userAgent.slice(0, 200), config.refreshTokenTtlDays],
  );
  return { accessToken: await signAccessToken(userId, familyId), refreshToken, expiresIn: config.accessTokenTtlSeconds };
}

export const createSession = (db: Db, userId: string, userAgent = '') =>
  insertSession(db, userId, randomUUID(), userAgent);

export class RefreshError extends Error {}

/**
 * Exchanges a refresh token for a new pair. Each refresh token works once; presenting a used one
 * outside the grace window means it leaked, so every session in its family is revoked.
 */
export async function rotateSession(db: Db, refreshToken: string, userAgent = ''): Promise<TokenPair> {
  const result = await db.tx(async (t) => {
    const s = await t.one(
      `SELECT id, user_id, family_id, expires_at, rotated_at, revoked_at FROM sessions WHERE token_hash = $1 FOR UPDATE`,
      [sha256(refreshToken)],
    );
    if (!s || s.revoked_at) return { error: 'invalid refresh token' } as const;
    if (s.rotated_at) {
      const stolen = Date.now() - new Date(s.rotated_at).getTime() > ROTATION_GRACE_MS;
      return { error: 'refresh token already used', revokeFamily: stolen ? (s.family_id as string) : undefined } as const;
    }
    if (new Date(s.expires_at).getTime() < Date.now()) return { error: 'refresh token expired' } as const;
    await t.query(`UPDATE sessions SET rotated_at = now() WHERE id = $1`, [s.id]);
    return { pair: await insertSession(t, s.user_id, s.family_id, userAgent) } as const;
  });
  if ('pair' in result && result.pair) return result.pair;
  // Revoke outside the transaction above so the error doesn't roll it back.
  if ('revokeFamily' in result && result.revokeFamily) await revokeFamily(db, result.revokeFamily);
  throw new RefreshError(result.error);
}

export async function revokeFamily(db: Db, familyId: string) {
  await db.query(`UPDATE sessions SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL`, [familyId]);
}

export async function isFamilyActive(db: Db, familyId: string) {
  const row = await db.one(
    `SELECT 1 FROM sessions WHERE family_id = $1 AND revoked_at IS NULL AND expires_at > now() LIMIT 1`,
    [familyId],
  );
  return !!row;
}
