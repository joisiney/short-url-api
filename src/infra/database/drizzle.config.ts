import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { join } from 'path';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: join(__dirname, '../../../', envFile) });

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 5432;
const user = process.env.DB_USER || 'shorturl';
const password = process.env.DB_PASSWORD || 'localpass123!';
const database = process.env.DB_NAME || 'shorturl';
const ssl = process.env.DB_SSL === 'true';

export default defineConfig({
  schema: './src/infra/database/schema/*.ts',
  out: './src/infra/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${user}:${password}@${host}:${port}/${database}${ssl ? '?sslmode=require' : ''}`,
  },
});
