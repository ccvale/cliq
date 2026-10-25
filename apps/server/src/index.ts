import { serve } from '@hono/node-server';
import { config } from './config.js';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { seed, DEMO_EMAIL, DEMO_PASSWORD } from './seed.js';

const db = await openDb({ url: config.databaseUrl, dataDir: config.dataDir });
// In development, fill an empty database with the demo account and people so the app works on first run.
if (!config.isProd && process.env.SEED !== 'off' && !(await db.one('SELECT 1 FROM users LIMIT 1'))) {
  await seed(db);
  console.log(`Added demo data. Sign in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}
const { app, injectWebSocket } = createApp(db);

const server = serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, ({ port }) => {
  console.log(`Cliq API listening on http://localhost:${port}`);
});
injectWebSocket(server);

const shutdown = async () => {
  server.close();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
