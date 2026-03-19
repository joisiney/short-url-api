import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../src/config/config.module';
import { DatabaseModule } from '../src/infra/database/database.module';
import { DrizzleShortUrlRepository } from '../src/modules/short-url/infra/repositories/drizzle-short-url.repository';
import { ShortUrl } from '../src/modules/short-url/domain/entities/short-url.entity';
import { createTestDb } from './helpers/db-test.helper';

describe('DrizzleShortUrlRepository (integration)', () => {
  let repository: DrizzleShortUrlRepository;
  let testDb: ReturnType<typeof createTestDb>;

  beforeAll(async () => {
    testDb = createTestDb();
    await testDb.runMigrations();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule],
      providers: [DrizzleShortUrlRepository],
    }).compile();

    repository = module.get(DrizzleShortUrlRepository);
  });

  beforeEach(async () => {
    await testDb.truncateShortUrls();
  });

  afterAll(async () => {
    await testDb.close();
  });

  let nextId = 14_000_000;

  function makeShortUrl(overrides: Partial<ShortUrl> = {}): ShortUrl {
    const id = String(nextId++);
    return new ShortUrl({
      id,
      url: 'https://example.com',
      shortCode: `sc${id.slice(-4)}`,
      accessCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  }

  it('deve criar short URL com sucesso', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'cr01' });

    await repository.create(shortUrl);

    const found = await repository.findByShortCode('cr01');
    expect(found).not.toBeNull();
    expect(found?.url).toBe('https://example.com');
    expect(found?.shortCode).toBe('cr01');
    expect(found?.accessCount).toBe(0);
  });

  it('deve buscar por shortCode', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'fd01' });
    await repository.create(shortUrl);

    const found = await repository.findByShortCode('fd01');

    expect(found).not.toBeNull();
    expect(found?.id).toBe(shortUrl.id);
    expect(found?.url).toBe(shortUrl.url);
  });

  it('deve buscar por url', async () => {
    const shortUrl = makeShortUrl({
      shortCode: 'by01',
      url: 'https://specific-url.com',
    });
    await repository.create(shortUrl);

    const found = await repository.findByUrl('https://specific-url.com');

    expect(found).not.toBeNull();
    expect(found?.shortCode).toBe('by01');
    expect(found?.url).toBe('https://specific-url.com');
  });

  it('deve retornar null quando url nao existe', async () => {
    const found = await repository.findByUrl('https://nonexistent.com');
    expect(found).toBeNull();
  });

  it('deve retornar null quando shortCode nao existe', async () => {
    const found = await repository.findByShortCode('n0p3');
    expect(found).toBeNull();
  });

  it('deve atualizar URL por shortCode', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'up01' });
    await repository.create(shortUrl);

    const updated = await repository.updateUrlByShortCode({
      shortCode: 'up01',
      url: 'https://updated.com',
    });

    expect(updated).not.toBeNull();
    expect(updated?.url).toBe('https://updated.com');
    expect(updated?.shortCode).toBe('up01');
    expect(updated?.accessCount).toBe(0);
  });

  it('deve retornar null ao atualizar shortCode inexistente', async () => {
    const updated = await repository.updateUrlByShortCode({
      shortCode: 'n0p3',
      url: 'https://any.com',
    });
    expect(updated).toBeNull();
  });

  it('deve deletar por shortCode', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'dl01' });
    await repository.create(shortUrl);

    const deleted = await repository.deleteByShortCode('dl01');

    expect(deleted).toBe(true);
    const found = await repository.findByShortCode('dl01');
    expect(found).toBeNull();
  });

  it('deve retornar false ao deletar shortCode inexistente', async () => {
    const deleted = await repository.deleteByShortCode('n0p3');
    expect(deleted).toBe(false);
  });

  it('deve incrementar accessCount', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'in01', accessCount: 0 });
    await repository.create(shortUrl);

    await repository.incrementAccessCount('in01');
    const after1 = await repository.findByShortCode('in01');
    expect(after1?.accessCount).toBe(1);

    await repository.incrementAccessCount('in01');
    const after2 = await repository.findByShortCode('in01');
    expect(after2?.accessCount).toBe(2);
  });
});
