import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import type { Db } from '../db.js';

const TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_AFTER_MS = 45_000;

const hash = (code: string) => createHmac('sha256', config.jwtSecret).update(code).digest('base64url');

export class CodeError extends Error {}
export type CodePurpose = 'verify' | 'reset' | 'signin';

/** Issues a fresh 6-digit code, replacing any earlier unused one for the same purpose. */
export async function issueCode(db: Db, userId: string, purpose: CodePurpose) {
  const latest = await db.one<{ created_at: string }>(
    `SELECT created_at FROM email_codes WHERE user_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose],
  );
  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_AFTER_MS) {
    throw new CodeError('We just sent a code. Give it a minute before asking for another.');
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.query(`UPDATE email_codes SET used_at = now() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`, [userId, purpose]);
  await db.query(
    `INSERT INTO email_codes (user_id, purpose, code_hash, expires_at) VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [userId, purpose, hash(code), TTL_MINUTES],
  );
  return code;
}

/** Checks a code and marks it used. Each code allows a handful of guesses before it is burned. */
export async function consumeCode(db: Db, userId: string, purpose: CodePurpose, code: string) {
  const row = await db.one<{ id: string; code_hash: string; attempts: number; expires_at: string }>(
    `SELECT id, code_hash, attempts, expires_at FROM email_codes
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose],
  );
  if (!row || new Date(row.expires_at).getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
    throw new CodeError('That code has expired. Request a new one.');
  }
  const ok = /^\d{6}$/.test(code) && timingSafeEqual(Buffer.from(hash(code)), Buffer.from(row.code_hash));
  if (!ok) {
    await db.query(`UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    throw new CodeError(row.attempts + 1 >= MAX_ATTEMPTS ? 'Too many tries. Request a new code.' : 'That code isn’t right.');
  }
  await db.query(`UPDATE email_codes SET used_at = now() WHERE id = $1`, [row.id]);
}
