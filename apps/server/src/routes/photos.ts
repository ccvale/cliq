import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { validate as zValidator } from '../lib/validate.js';
import type { Db } from '../db.js';
import { requireAuth, type AuthEnv } from '../auth/middleware.js';

const MAX_BYTES = 2 * 1024 * 1024;

/** Public URL for a user's photo. The version query busts caches when the photo changes. */
export const photoUrl = (userId: string, updatedAt: unknown) =>
  updatedAt ? `/photos/${userId}?v=${new Date(updatedAt as string).getTime()}` : null;

/** Identifies the image from its first bytes rather than trusting the declared content type. */
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function photoRoutes(db: Db) {
  const r = new Hono<AuthEnv>();
  // Mounted at the root, so guard only this router's paths (not /ws or /health).
  r.use('/me/photo', requireAuth);

  // The app resizes and compresses before uploading, so the server only checks type and size.
  r.put('/me/photo', async (c) => {
    if (Number(c.req.header('content-length') ?? 0) > MAX_BYTES) throw new HTTPException(413, { message: 'That photo is too large' });
    const bytes = new Uint8Array(await c.req.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) throw new HTTPException(413, { message: 'That photo is too large' });
    const mime = sniff(bytes);
    if (!mime) throw new HTTPException(415, { message: 'Use a JPEG, PNG or WebP photo' });
    const row = await db.one<{ updated_at: string }>(
      `INSERT INTO photos (user_id, mime, data) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
       RETURNING updated_at`,
      [c.var.userId, mime, Buffer.from(bytes)],
    );
    return c.json({ photoUrl: photoUrl(c.var.userId, row!.updated_at) });
  });

  r.delete('/me/photo', async (c) => {
    await db.query('DELETE FROM photos WHERE user_id = $1', [c.var.userId]);
    return c.body(null, 204);
  });

  // Public so <Image> can load it without headers. Ids are random UUIDs that only appear on cards.
  r.get('/photos/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const row = await db.one<{ mime: string; data: Uint8Array }>('SELECT mime, data FROM photos WHERE user_id = $1', [
      c.req.valid('param').id,
    ]);
    if (!row) throw new HTTPException(404, { message: 'No photo' });
    c.header('Content-Type', row.mime);
    c.header('Cache-Control', c.req.query('v') ? 'public, max-age=31536000, immutable' : 'public, max-age=300');
    return c.body(new Uint8Array(row.data));
  });

  return r;
}
