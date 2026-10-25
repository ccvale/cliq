import { serve } from '@hono/node-server';
import { config } from './config.js';
import { openDb } from './db.js';
import { createApp } from './app.js';

const db = await openDb({ url: config.databaseUrl, dataDir: config.dataDir });
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
