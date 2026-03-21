import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { join } from 'path';
import { parsePgConnectionEnv } from '@config/parse-pg-connection-env';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: join(__dirname, '../../../', envFile) });

const pg = parsePgConnectionEnv(process.env, '[drizzle.config]');

export default defineConfig({
  schema: './src/infra/database/schema/*.ts',
  out: './src/infra/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: pg.toDatabaseUrl(),
  },
});
