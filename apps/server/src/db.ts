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
    const pool = new pg.Pool({ connectionString: opts.url });
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
  const done = new Set((await db.query<{ id: number }>('SELECT id FROM schema_migrations')).map((r) => r.id));
  for (const [i, sql] of migrations.entries()) {
    const id = i + 1;
    if (done.has(id)) continue;
    await db.tx(async (t) => {
      for (const statement of sql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
        await t.query(statement);
      }
      await t.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
    });
  }
}
