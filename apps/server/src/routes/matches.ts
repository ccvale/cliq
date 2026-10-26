import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { validate as zValidator } from '../lib/validate.js';
import { z } from 'zod';
import type { Db, Row } from '../db.js';
import { rateLimit, requireAuth, requireVerified, type AuthEnv } from '../auth/middleware.js';
import { blockUser } from './blocks.js';
import { ageOn } from '../lib/age.js';
import { distanceMiles } from '../lib/geo.js';
import { sendPush, type Hub, type MessageDto } from '../realtime.js';
import { toCard } from './discover.js';

export const toMessage = (m: Row): MessageDto => ({
  id: m.id,
  matchId: m.match_id,
  senderId: m.sender_id,
  body: m.body,
  createdAt: new Date(m.created_at).toISOString(),
  readAt: m.read_at ? new Date(m.read_at).toISOString() : null,
});

/** Loads a match the user belongs to, or throws 404. Ended matches are hidden from both people. */
export async function loadMatch(db: Db, matchId: string, userId: string) {
  const m = await db.one(
    `SELECT id, CASE WHEN user_a = $2 THEN user_b ELSE user_a END AS other_id
     FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2) AND ended_at IS NULL`,
    [matchId, userId],
  );
  if (!m) throw new HTTPException(404, { message: 'This conversation is no longer available' });
  return m as { id: string; other_id: string };
}

export function matchRoutes(db: Db, hub: Hub) {
  const r = new Hono<AuthEnv>();
  // Mounted at the root, so guard only this router's paths (not /ws or /health).
  r.use('/matches', requireAuth);
  r.use('/matches/*', requireAuth);
  r.use('/reports', requireAuth);
  const uuid = z.object({ id: z.string().uuid() });

  r.get('/matches', async (c) => {
    const me = c.var.userId;
    const rows = await db.query(
      `SELECT m.id AS match_id, m.created_at AS matched_at, p.*, ph.updated_at AS photo_at,
              last.body AS last_body, last.sender_id AS last_sender, last.created_at AS last_at,
              (SELECT count(*)::int FROM messages x WHERE x.match_id = m.id AND x.sender_id <> $1 AND x.read_at IS NULL) AS unread
       FROM matches m
       JOIN profiles p ON p.user_id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
       LEFT JOIN photos ph ON ph.user_id = p.user_id
       LEFT JOIN LATERAL (SELECT body, sender_id, created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) last ON true
       WHERE (m.user_a = $1 OR m.user_b = $1) AND m.ended_at IS NULL
       ORDER BY COALESCE(last.created_at, m.created_at) DESC`,
      [me],
    );
    const mine = await db.one('SELECT lat, lng, interests FROM profiles WHERE user_id = $1', [me]);
    return c.json({
      matches: rows.map((p) => ({
        id: p.match_id,
        matchedAt: new Date(p.matched_at).toISOString(),
        person: toCard(
          p,
          ageOn(p.birthday),
          mine?.lat != null && p.lat != null ? distanceMiles(mine as any, p as any) : 0,
          (p.interests as string[]).filter((i) => mine?.interests.includes(i)),
        ),
        lastMessage: p.last_body
          ? { body: p.last_body, fromMe: p.last_sender === me, at: new Date(p.last_at).toISOString() }
          : null,
        unread: p.unread,
      })),
    });
  });

  r.get(
    '/matches/:id/messages',
    zValidator('param', uuid),
    zValidator('query', z.object({ before: z.string().datetime().optional() })),
    async (c) => {
      const match = await loadMatch(db, c.req.valid('param').id, c.var.userId);
      const before = c.req.valid('query').before ?? new Date(Date.now() + 60_000).toISOString();
      const rows = await db.query(
        `SELECT * FROM messages WHERE match_id = $1 AND created_at < $2 ORDER BY created_at DESC LIMIT 50`,
        [match.id, before],
      );
      return c.json({ messages: rows.reverse().map(toMessage), hasMore: rows.length === 50 });
    },
  );

  r.post(
    '/matches/:id/messages',
    requireVerified(db),
    rateLimit({ limit: 30, windowMs: 60_000, perUser: true, message: 'You’re sending messages very fast. Wait a moment and try again.' }),
    zValidator('param', uuid),
    zValidator('json', z.object({ body: z.string().trim().min(1).max(2000) })),
    async (c) => {
      const me = c.var.userId;
      const match = await loadMatch(db, c.req.valid('param').id, me);
      const row = await db.one('INSERT INTO messages (match_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *', [
        match.id,
        me,
        c.req.valid('json').body,
      ]);
      const message = toMessage(row!);
      hub.emit(me, { type: 'message:new', message });
      hub.emit(match.other_id, { type: 'message:new', message });
      if (!hub.isOnline(match.other_id)) {
        const sender = await db.one('SELECT display_name FROM profiles WHERE user_id = $1', [me]);
        void sendPush(db, match.other_id, {
          title: sender?.display_name ?? 'New message',
          body: message.body.slice(0, 140),
          data: { matchId: match.id },
          kind: 'message',
        });
      }
      return c.json(message, 201);
    },
  );

  r.post('/matches/:id/read', zValidator('param', uuid), async (c) => {
    const me = c.var.userId;
    const match = await loadMatch(db, c.req.valid('param').id, me);
    const updated = await db.query(
      `UPDATE messages SET read_at = now() WHERE match_id = $1 AND sender_id <> $2 AND read_at IS NULL RETURNING read_at`,
      [match.id, me],
    );
    if (updated.length) {
      hub.emit(match.other_id, { type: 'message:read', matchId: match.id, readerId: me, at: new Date().toISOString() });
    }
    return c.body(null, 204);
  });

  r.delete('/matches/:id', zValidator('param', uuid), async (c) => {
    const match = await loadMatch(db, c.req.valid('param').id, c.var.userId);
    await db.query('UPDATE matches SET ended_at = now() WHERE id = $1', [match.id]);
    hub.emit(match.other_id, { type: 'match:ended', matchId: match.id });
    hub.emit(c.var.userId, { type: 'match:ended', matchId: match.id });
    return c.body(null, 204);
  });

  r.post(
    '/reports',
    zValidator('json', z.object({ targetId: z.string().uuid(), reason: z.string().trim().min(1).max(500) })),
    async (c) => {
      const me = c.var.userId;
      const { targetId, reason } = c.req.valid('json');
      if (targetId === me) throw new HTTPException(400, { message: 'You can’t report yourself' });
      await db.query('INSERT INTO reports (reporter_id, target_id, reason) VALUES ($1, $2, $3)', [me, targetId, reason]);
      // Reporting also blocks, so neither person sees the other again.
      await blockUser(db, hub, me, targetId);
      return c.body(null, 204);
    },
  );

  return r;
}
