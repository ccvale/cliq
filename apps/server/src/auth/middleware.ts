import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { verifyAccessToken } from './tokens.js';
import type { Db } from '../db.js';

export type AuthEnv = { Variables: { userId: string; family: string } };

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const { userId, family } = await verifyAccessToken(token);
    c.set('userId', userId);
    c.set('family', family);
  } catch {
    throw new HTTPException(401, { message: 'Not signed in' });
  }
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

/** Fixed-window limiter keyed by client address. Enough to blunt password guessing on a single instance. */
export function rateLimit({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return createMiddleware(async (c, next) => {
    if (process.env.RATE_LIMIT === 'off') return next();
    const key =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      (c.env as any)?.incoming?.socket?.remoteAddress ||
      'local';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    } else if (++entry.count > limit) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      throw new HTTPException(429, { message: 'Too many attempts. Try again in a minute.' });
    }
    await next();
  });
}
