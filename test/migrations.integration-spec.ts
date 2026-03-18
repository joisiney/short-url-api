import { sql } from 'drizzle-orm';
import { createTestDb } from './helpers/db-test.helper';

describe('Migrations e schema (integration)', () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeAll(async () => {
    testDb = createTestDb();
    await testDb.runMigrations();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('deve aplicar migrations sem erro', async () => {
    await expect(testDb.runMigrations()).resolves.not.toThrow();
  });

  it('deve existir tabela short_urls com colunas esperadas', async () => {
    const result = await testDb.pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'short_urls'
      ORDER BY ordinal_position
    `);
    const columns = result.rows.map((r: { column_name: string }) => r.column_name);

    expect(columns).toContain('id');
    expect(columns).toContain('url');
    expect(columns).toContain('short_code');
    expect(columns).toContain('access_count');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('deve existir constraint de unicidade em short_code', async () => {
    const result = await testDb.pool.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'short_urls' AND constraint_type = 'UNIQUE'
    `);
    const names = result.rows.map((r: { constraint_name: string }) => r.constraint_name);
    expect(names.some((n) => n.includes('short_code'))).toBe(true);
  });
});
