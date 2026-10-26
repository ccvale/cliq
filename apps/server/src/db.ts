import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { migrations } from './migrations.js';

export type Row = Record<string, any>;

/** The small slice of a Postgres client the app needs, so PGlite and node-postgres are interchangeable. */
export interface Db {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T | undefined>;
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

type Querier = { query: (sql: string, params?: any[]) => Promise<{ rows: any[] }> };

function wrap(q: Querier, tx: Db['tx'], close: Db['close']): Db {
  const query = async <T extends Row>(sql: string, params: unknown[] = []) =>
    (await q.query(sql, params as any[])).rows as T[];
  return {
    query,
    one: async <T extends Row>(sql: string, params?: unknown[]) => (await query<T>(sql, params))[0],
    tx,
    close,
  };
}

export async function openDb(opts: { url?: string; dataDir?: string } = {}): Promise<Db> {
  let db: Db;
  if (opts.url) {
    const pool = new pg.Pool({
      connectionString: opts.url,
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      // Managed Postgres such as Supabase: pass its CA certificate (PEM) to verify the server.
      ...(process.env.DATABASE_CA && { ssl: { ca: process.env.DATABASE_CA.replace(/\\n/g, '\n') } }),
    });
    const tx: Db['tx'] = async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(wrap(client, () => Promise.reject(new Error('nested tx')), async () => {}));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    };
    db = wrap(pool, tx, () => pool.end());
  } else {
    // Embedded Postgres for local development and tests. `memory://` keeps nothing on disk.
    if (opts.dataDir && !opts.dataDir.startsWith('memory://')) mkdirSync(opts.dataDir, { recursive: true });
    const lite = new PGlite(opts.dataDir ?? 'memory://');
    const tx: Db['tx'] = (fn) =>
      lite.transaction((t) => fn(wrap(t, () => Promise.reject(new Error('nested tx')), async () => {})));
    db = wrap(lite, tx, () => lite.close());
  }
  await migrate(db);
  return db;
}

async function migrate(db: Db) {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id INT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  for (const [i, sql] of migrations.entries()) {
    const id = i + 1;
    await db.tx(async (t) => {
      // Several API instances may boot at once against the same database; one migrates, the others wait.
      await t.query('SELECT pg_advisory_xact_lock(4120)');
      if (await t.one('SELECT 1 FROM schema_migrations WHERE id = $1', [id])) return;
      for (const statement of sql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
        await t.query(statement);
      }
      await t.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
    });
  }
}
