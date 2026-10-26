import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { isFamilyActive, verifyAccessToken } from './tokens.js';
import { config } from '../config.js';
import type { Db } from '../db.js';

export type AuthEnv = { Variables: { userId: string; family: string; db: Db } };

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  let claims: { userId: string; family: string };
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw new HTTPException(401, { message: 'Not signed in' });
  }
  // Signing out a device takes effect right away, not when its 15-minute access token runs out.
  if (!(await isFamilyActive(c.get('db'), claims.family))) throw new HTTPException(401, { message: 'Not signed in' });
  c.set('userId', claims.userId);
  c.set('family', claims.family);
  await next();
});

/** Blocks actions that reach other people until the account's email is confirmed. Use after requireAuth. */
export const requireVerified = (db: Db) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const row = await db.one<{ verified: boolean }>('SELECT email_verified_at IS NOT NULL AS verified FROM users WHERE id = $1', [
      c.var.userId,
    ]);
    if (!row?.verified) throw new HTTPException(403, { message: 'Confirm your email first', cause: 'verify-email' });
    await next();
  });

/**
 * Fixed-window limiter, keyed by client address or, with `perUser`, by account (after requireAuth).
 * Enough to blunt password guessing and spam on a single instance.
 */
export function rateLimit({ limit, windowMs, perUser, message }: { limit: number; windowMs: number; perUser?: boolean; message?: string }) {
  const limiter = createLimiter({ limit, windowMs, message });
  return createMiddleware(async (c, next) => {
    limiter.hit(perUser ? String(c.get('userId')) : clientIp(c));
    await next();
  });
}

/** The caller's address. X-Forwarded-For is only believed behind a trusted proxy, using the entry that proxy added. */
export function clientIp(c: { req: { header: (k: string) => string | undefined }; env: unknown }) {
  const forwarded = config.trustProxy ? c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim() : undefined;
  return forwarded || (c.env as any)?.incoming?.socket?.remoteAddress || 'local';
}

/** A counter you can key by anything, such as an email address, so guessing can't hop between IPs. */
export function createLimiter({ limit, windowMs, message }: { limit: number; windowMs: number; message?: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key: string) {
      if (process.env.RATE_LIMIT === 'off') return;
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt < now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
      } else if (++entry.count > limit) {
        throw new HTTPException(429, { message: message ?? 'Too many attempts. Try again in a minute.' });
      }
    },
  };
}
