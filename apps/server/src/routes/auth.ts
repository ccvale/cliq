import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { validate as zValidator } from '../lib/validate.js';
import { z } from 'zod';
import type { Db } from '../db.js';
import { dummyVerify, hashPassword, verifyPassword } from '../auth/password.js';
import { createSession, revokeFamily, rotateSession, RefreshError } from '../auth/tokens.js';
import { verifyAppleToken, verifyGoogleToken, type ExternalIdentity } from '../auth/oauth.js';
import { rateLimit, requireAuth, type AuthEnv } from '../auth/middleware.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /[^a-zA-Z]/.test(p), 'Mix letters with a number or symbol');

export function authRoutes(db: Db) {
  const r = new Hono<AuthEnv>();
  const ua = (c: { req: { header: (k: string) => string | undefined } }) => c.req.header('user-agent') ?? '';
  const limited = rateLimit({ limit: 10, windowMs: 60_000 });

  r.post('/signup', limited, zValidator('json', z.object({ email, password })), async (c) => {
    const body = c.req.valid('json');
    const exists = await db.one('SELECT 1 FROM users WHERE lower(email) = $1', [body.email]);
    if (exists) throw new HTTPException(409, { message: 'An account with that email already exists' });
    const user = await db.tx(async (t) => {
      const u = await t.one<{ id: string }>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [body.email, await hashPassword(body.password)],
      );
      await t.query('INSERT INTO profiles (user_id) VALUES ($1)', [u!.id]);
      return u!;
    });
    return c.json(await createSession(db, user.id, ua(c)), 201);
  });

  r.post('/signin', limited, zValidator('json', z.object({ email, password: z.string().max(200) })), async (c) => {
    const body = c.req.valid('json');
    const user = await db.one<{ id: string; password_hash: string | null }>(
      'SELECT id, password_hash FROM users WHERE lower(email) = $1',
      [body.email],
    );
    const ok = user?.password_hash ? await verifyPassword(body.password, user.password_hash) : await dummyVerify(body.password);
    if (!user || !ok) throw new HTTPException(401, { message: 'That email and password don’t match' });
    return c.json(await createSession(db, user.id, ua(c)));
  });

  /** Finds the account linked to an Apple or Google identity, linking or creating one as needed. */
  async function signInExternal(provider: 'apple' | 'google', id: ExternalIdentity, displayName?: string) {
    const column = provider === 'apple' ? 'apple_sub' : 'google_sub';
    return db.tx(async (t) => {
      const linked = await t.one<{ id: string }>(`SELECT id FROM users WHERE ${column} = $1`, [id.subject]);
      if (linked) return linked.id;
      // Only link to an existing email account when the provider has verified the address.
      if (id.email && id.emailVerified) {
        const byEmail = await t.one<{ id: string }>('SELECT id FROM users WHERE lower(email) = lower($1)', [id.email]);
        if (byEmail) {
          await t.query(`UPDATE users SET ${column} = $1 WHERE id = $2`, [id.subject, byEmail.id]);
          return byEmail.id;
        }
      }
      const u = await t.one<{ id: string }>(`INSERT INTO users (email, ${column}) VALUES ($1, $2) RETURNING id`, [
        id.email && id.emailVerified ? id.email : null,
        id.subject,
      ]);
      await t.query('INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)', [u!.id, displayName?.slice(0, 40) ?? '']);
      return u!.id;
    });
  }

  r.post(
    '/apple',
    limited,
    zValidator('json', z.object({ identityToken: z.string().min(10), givenName: z.string().max(40).optional() })),
    async (c) => {
      const body = c.req.valid('json');
      const identity = await verifyAppleToken(body.identityToken).catch((e) => {
        throw new HTTPException(401, { message: e.message ?? 'Apple sign in failed' });
      });
      return c.json(await createSession(db, await signInExternal('apple', identity, body.givenName), ua(c)));
    },
  );

  r.post('/google', limited, zValidator('json', z.object({ idToken: z.string().min(10) })), async (c) => {
    const identity = await verifyGoogleToken(c.req.valid('json').idToken).catch((e) => {
      throw new HTTPException(401, { message: e.message ?? 'Google sign in failed' });
    });
    return c.json(await createSession(db, await signInExternal('google', identity), ua(c)));
  });

  r.post('/refresh', zValidator('json', z.object({ refreshToken: z.string().min(20).max(200) })), async (c) => {
    try {
      return c.json(await rotateSession(db, c.req.valid('json').refreshToken, ua(c)));
    } catch (err) {
      if (err instanceof RefreshError) throw new HTTPException(401, { message: 'Session expired' });
      throw err;
    }
  });

  r.post('/signout', requireAuth, async (c) => {
    await revokeFamily(db, c.var.family);
    return c.body(null, 204);
  });

  r.post(
    '/password',
    requireAuth,
    limited,
    zValidator('json', z.object({ current: z.string().max(200).optional(), next: password })),
    async (c) => {
      const body = c.req.valid('json');
      const user = await db.one<{ password_hash: string | null }>('SELECT password_hash FROM users WHERE id = $1', [c.var.userId]);
      if (user?.password_hash && !(await verifyPassword(body.current ?? '', user.password_hash))) {
        throw new HTTPException(403, { message: 'Your current password is incorrect' });
      }
      await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(body.next), c.var.userId]);
      // Sign out every other device.
      await db.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND family_id <> $2 AND revoked_at IS NULL', [
        c.var.userId,
        c.var.family,
      ]);
      return c.body(null, 204);
    },
  );

  r.delete('/account', requireAuth, async (c) => {
    await db.query('DELETE FROM users WHERE id = $1', [c.var.userId]);
    return c.body(null, 204);
  });

  return r;
}
