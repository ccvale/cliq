import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { createNodeWebSocket } from '@hono/node-ws';
import type { WSContext } from 'hono/ws';
import { config } from './config.js';
import type { Db } from './db.js';
import { Hub } from './realtime.js';
import { isFamilyActive, verifyAccessToken } from './auth/tokens.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { discoverRoutes } from './routes/discover.js';
import { loadMatch, matchRoutes } from './routes/matches.js';
import { photoRoutes } from './routes/photos.js';
import { blockRoutes } from './routes/blocks.js';
import { searchRoutes } from './routes/search.js';

export function createApp(db: Db) {
  const hub = new Hub();
  // Tell a user's friends when they come and go, unless they've hidden their online status.
  hub.onPresence = (userId, online, force) => {
    void (async () => {
      await db.query('UPDATE profiles SET last_active_at = now() WHERE user_id = $1', [userId]);
      const user = await db.one<{ show_online: boolean }>('SELECT show_online FROM users WHERE id = $1', [userId]);
      if (!force && !user?.show_online) return;
      const friends = await db.query<{ other_id: string }>(
        `SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END AS other_id FROM matches
         WHERE (user_a = $1 OR user_b = $1) AND ended_at IS NULL`,
        [userId],
      );
      const at = new Date().toISOString();
      for (const { other_id } of friends) hub.emit(other_id, { type: 'presence', userId, online, at });
    })().catch((err) => console.warn('presence', err));
  };
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  // Photos and chat pictures are loaded by <img> from the web app's origin, so they need a cross-origin resource policy.
  const strict = secureHeaders();
  const embeddable = secureHeaders({ crossOriginResourcePolicy: 'cross-origin' });
  app.use('*', (c, next) => (c.req.path.startsWith('/photos/') || c.req.path.startsWith('/media/') ? embeddable : strict)(c, next));
  // requireAuth reads the database from the context to check the session is still active.
  app.use('*', async (c, next) => {
    c.set('db' as never, db as never);
    await next();
  });
  app.use(
    '*',
    cors({
      origin: (origin) => (config.corsOrigins.includes(origin) ? origin : null),
      allowHeaders: ['authorization', 'content-type'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      maxAge: 600,
    }),
  );

  app.get('/health', (c) => c.json({ ok: true }));
  app.route('/auth', authRoutes(db));
  app.route('/me', meRoutes(db, hub));
  app.route('/', discoverRoutes(db, hub));
  app.route('/', matchRoutes(db, hub));
  app.route('/', photoRoutes(db, hub));
  app.route('/', blockRoutes(db, hub));
  app.route('/', searchRoutes(db));

  /**
   * Realtime channel. Browsers can't set headers on a WebSocket, and tokens in URLs end up in logs,
   * so the client authenticates with its first message instead.
   */
  app.get(
    '/ws',
    upgradeWebSocket(() => {
      let userId: string | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      return {
        onOpen(_evt, ws) {
          timer = setTimeout(() => !userId && ws.close(4401, 'auth timeout'), 5_000);
        },
        async onMessage(evt, ws: WSContext) {
          let msg: any;
          try {
            msg = JSON.parse(String(evt.data));
          } catch {
            return;
          }
          if (!userId) {
            if (msg?.type !== 'auth') return ws.close(4401, 'auth required');
            try {
              const claims = await verifyAccessToken(String(msg.token));
              if (!(await isFamilyActive(db, claims.family))) throw new Error('revoked');
              userId = claims.userId;
              clearTimeout(timer);
              hub.add(userId, ws);
              ws.send(JSON.stringify({ type: 'ready' }));
            } catch {
              ws.close(4401, 'invalid token');
            }
            return;
          }
          if (msg?.type === 'typing' && typeof msg.matchId === 'string') {
            const match = await loadMatch(db, msg.matchId, userId).catch(() => null);
            if (match) hub.emit(match.other_id, { type: 'typing', matchId: match.id, userId });
          } else if (msg?.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        },
        onClose(_evt, ws) {
          clearTimeout(timer);
          if (userId) hub.remove(userId, ws);
        },
      };
    }),
  );

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      // A string cause is a machine-readable code the app can act on, such as 'verify-email'.
      return c.json({ error: err.message, ...(typeof err.cause === 'string' && { code: err.cause }) }, err.status);
    }
    console.error(err);
    return c.json({ error: 'Something went wrong on our end' }, 500);
  });
  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  return { app, hub, injectWebSocket };
}
