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
import { sniff } from './photos.js';
import { GIF_HOST } from './search.js';
import { BADGES_SQL, awardLater } from '../lib/achievements.js';

const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

/** Chat pictures are served by unguessable id, like profile photos, so <Image> can load them without headers. */
const mediaUrl = (id: string) => `/media/${id}`;

/** What the friends list shows for a conversation's latest message. */
const preview = (kind: string, body: string) => (kind === 'image' ? '📷 Photo' : kind === 'gif' ? 'GIF' : body);

export const toMessage = (m: Row): MessageDto => ({
  id: m.id,
  matchId: m.match_id,
  senderId: m.sender_id,
  kind: m.kind ?? 'text',
  body: m.body,
  media: m.media ?? null,
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
  // Shared by text, GIF and picture messages so switching type doesn't get around it.
  const messageLimit = rateLimit({ limit: 30, windowMs: 60_000, perUser: true, message: 'You’re sending messages very fast. Wait a moment and try again.' });
  const uuid = z.object({ id: z.string().uuid() });

  r.get('/matches', async (c) => {
    const me = c.var.userId;
    const rows = await db.query(
      `SELECT m.id AS match_id, m.created_at AS matched_at, p.*, ph.updated_at AS photo_at, ${BADGES_SQL}, u.show_online,
              last.body AS last_body, last.kind AS last_kind, last.sender_id AS last_sender, last.created_at AS last_at,
              (SELECT count(*)::int FROM messages x WHERE x.match_id = m.id AND x.sender_id <> $1 AND x.read_at IS NULL) AS unread
       FROM matches m
       JOIN profiles p ON p.user_id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
       JOIN users u ON u.id = p.user_id
       LEFT JOIN photos ph ON ph.user_id = p.user_id
       LEFT JOIN LATERAL (SELECT body, kind, sender_id, created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) last ON true
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
        lastMessage: p.last_at
          ? { body: preview(p.last_kind, p.last_body), fromMe: p.last_sender === me, at: new Date(p.last_at).toISOString() }
          : null,
        unread: p.unread,
        // People who hide their status are never shown online and their last-active time stays private.
        online: p.show_online ? hub.isOnline(p.user_id) : false,
        lastActiveAt: p.show_online ? new Date(p.last_active_at).toISOString() : null,
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

  /** Saves a message, delivers it live and falls back to a push notification when the other person is away. */
  async function deliver(me: string, match: { id: string; other_id: string }, kind: 'text' | 'image' | 'gif', body: string, media: object | null) {
    const row = await db.one('INSERT INTO messages (match_id, sender_id, kind, body, media) VALUES ($1, $2, $3, $4, $5) RETURNING *', [
      match.id,
      me,
      kind,
      body,
      media && JSON.stringify(media),
    ]);
    const message = toMessage(row!);
    hub.emit(me, { type: 'message:new', message });
    hub.emit(match.other_id, { type: 'message:new', message });
    if (!hub.isOnline(match.other_id)) {
      const sender = await db.one('SELECT display_name FROM profiles WHERE user_id = $1', [me]);
      void sendPush(db, match.other_id, {
        title: sender?.display_name ?? 'New message',
        body: kind === 'text' ? body.slice(0, 140) : kind === 'image' ? 'Sent a photo' : 'Sent a GIF',
        data: { matchId: match.id },
        kind: 'message',
      });
    }
    awardLater(db, hub, me);
    return message;
  }

  r.post(
    '/matches/:id/messages',
    requireVerified(db),
    messageLimit,
    zValidator('param', uuid),
    zValidator(
      'json',
      z.union([
        z.object({ body: z.string().trim().min(1).max(2000) }),
        z.object({
          gif: z.object({
            url: z.string().url().regex(GIF_HOST, 'Pick a GIF from search'),
            width: z.number().int().min(1).max(2000),
            height: z.number().int().min(1).max(2000),
          }),
        }),
      ]),
    ),
    async (c) => {
      const match = await loadMatch(db, c.req.valid('param').id, c.var.userId);
      const input = c.req.valid('json');
      const message =
        'gif' in input ? await deliver(c.var.userId, match, 'gif', '', input.gif) : await deliver(c.var.userId, match, 'text', input.body, null);
      return c.json(message, 201);
    },
  );

  // Picture messages: the raw image is the request body, its laid-out size comes in the query string.
  r.post(
    '/matches/:id/images',
    requireVerified(db),
    messageLimit,
    zValidator('param', uuid),
    zValidator('query', z.object({ w: z.coerce.number().int().min(1).max(10_000), h: z.coerce.number().int().min(1).max(10_000) })),
    async (c) => {
      const match = await loadMatch(db, c.req.valid('param').id, c.var.userId);
      if (Number(c.req.header('content-length') ?? 0) > MAX_MEDIA_BYTES) throw new HTTPException(413, { message: 'That picture is too large' });
      const bytes = new Uint8Array(await c.req.arrayBuffer());
      if (bytes.byteLength > MAX_MEDIA_BYTES) throw new HTTPException(413, { message: 'That picture is too large' });
      const mime = sniff(bytes);
      if (!mime) throw new HTTPException(415, { message: 'Send a JPEG, PNG, WebP or GIF' });
      const saved = await db.one<{ id: string }>(
        'INSERT INTO message_media (match_id, uploader_id, mime, data) VALUES ($1, $2, $3, $4) RETURNING id',
        [match.id, c.var.userId, mime, Buffer.from(bytes)],
      );
      const { w, h } = c.req.valid('query');
      const message = await deliver(c.var.userId, match, mime === 'image/gif' ? 'gif' : 'image', '', { url: mediaUrl(saved!.id), width: w, height: h });
      return c.json(message, 201);
    },
  );

  r.get('/media/:id', zValidator('param', uuid), async (c) => {
    // Pictures disappear with the conversation: unmatching, blocking or deleting an account hides them.
    const row = await db.one<{ mime: string; data: Uint8Array }>(
      `SELECT mm.mime, mm.data FROM message_media mm JOIN matches m ON m.id = mm.match_id
       WHERE mm.id = $1 AND m.ended_at IS NULL`,
      [c.req.valid('param').id],
    );
    if (!row) throw new HTTPException(404, { message: 'This picture is no longer available' });
    c.header('Content-Type', row.mime);
    c.header('Cache-Control', 'private, max-age=86400');
    return c.body(new Uint8Array(row.data));
  });

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
