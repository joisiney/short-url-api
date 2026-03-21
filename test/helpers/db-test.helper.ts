import { Pool } from 'pg';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as shortUrlsSchema from '../../src/infra/database/schema/short-urls.table';
import { sql } from 'drizzle-orm';
import { parsePgConnectionEnv } from '@config/parse-pg-connection-env';

export type TestDb = ReturnType<typeof createTestDb>;

export function createTestDb() {
  const pg = parsePgConnectionEnv(process.env, '[db-test.helper]');
  const pool = new Pool(pg.toPgPoolConfig());

  const db = drizzle({ client: pool, schema: shortUrlsSchema });

  return {
    pool,
    db,
    async runMigrations() {
      await migrate(db, {
        migrationsFolder: resolve(
          __dirname,
          '../../src/infra/database/migrations',
        ),
      });
    },
    async truncateShortUrls() {
      await db.execute(sql`TRUNCATE TABLE short_urls CASCADE`);
    },
    async close() {
      await pool.end();
    },
  };
}
