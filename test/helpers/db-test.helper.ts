import { Pool } from 'pg';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as shortUrlsSchema from '../../src/infra/database/schema/short-urls.table';
import { sql } from 'drizzle-orm';

export type TestDb = ReturnType<typeof createTestDb>;

export function createTestDb() {
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'Pg!Strong123',
    database: process.env.DB_NAME ?? 'short_url_test',
    ssl: false,
  });

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
      await db.execute(sql`TRUNCATE TABLE short_urls RESTART IDENTITY CASCADE`);
    },
    async close() {
      await pool.end();
    },
  };
}
