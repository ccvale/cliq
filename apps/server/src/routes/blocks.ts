import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { validate as zValidator } from '../lib/validate.js';
import type { Db } from '../db.js';
import { requireAuth, type AuthEnv } from '../auth/middleware.js';
import type { Hub } from '../realtime.js';
import { photoUrl } from './photos.js';

/** Blocks someone: ends any match between you, and neither of you sees the other in Discover again. */
export async function blockUser(db: Db, hub: Hub, me: string, targetId: string) {
  const ended = await db.tx(async (t) => {
    await t.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [me, targetId]);
    return t.query<{ id: string }>(
      `UPDATE matches SET ended_at = now()
       WHERE ended_at IS NULL AND ((user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)) RETURNING id`,
      [me, targetId],
    );
  });
  for (const { id } of ended) {
    hub.emit(targetId, { type: 'match:ended', matchId: id });
    hub.emit(me, { type: 'match:ended', matchId: id });
  }
}

export function blockRoutes(db: Db, hub: Hub) {
  const r = new Hono<AuthEnv>();
  // Mounted at the root, so guard only this router's paths (not /ws or /health).
  r.use('/blocks', requireAuth);
  r.use('/blocks/*', requireAuth);
  const target = z.object({ id: z.string().uuid() });

  r.get('/blocks', async (c) => {
    const rows = await db.query(
      `SELECT b.blocked_id, b.created_at, p.display_name, p.palette, ph.updated_at AS photo_at
       FROM blocks b JOIN profiles p ON p.user_id = b.blocked_id LEFT JOIN photos ph ON ph.user_id = b.blocked_id
       WHERE b.blocker_id = $1 ORDER BY b.created_at DESC`,
      [c.var.userId],
    );
    return c.json({
      blocks: rows.map((b) => ({
        id: b.blocked_id,
        displayName: b.display_name,
        palette: b.palette,
        photoUrl: photoUrl(b.blocked_id, b.photo_at),
        blockedAt: new Date(b.created_at).toISOString(),
      })),
    });
  });

  r.post('/blocks/:id', zValidator('param', target), async (c) => {
    const { id } = c.req.valid('param');
    if (id === c.var.userId) throw new HTTPException(400, { message: 'You can’t block yourself' });
    if (!(await db.one('SELECT 1 FROM users WHERE id = $1', [id]))) throw new HTTPException(404, { message: 'That person is no longer on Cliq' });
    await blockUser(db, hub, c.var.userId, id);
    return c.body(null, 204);
  });

  // Unblocking lets you see each other in Discover again. An ended match stays ended.
  r.delete('/blocks/:id', zValidator('param', target), async (c) => {
    await db.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [c.var.userId, c.req.valid('param').id]);
    return c.body(null, 204);
  });

  return r;
}
