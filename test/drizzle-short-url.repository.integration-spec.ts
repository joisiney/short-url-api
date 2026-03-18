import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../src/config/config.module';
import { DatabaseModule } from '../src/infra/database/database.module';
import { DrizzleShortUrlRepository } from '../src/modules/short-url/infra/repositories/drizzle-short-url.repository';
import { ShortUrl } from '../src/modules/short-url/domain/entities/short-url.entity';
import { ShortCodeConflictError } from '../src/modules/short-url/domain/errors/short-code-conflict.error';
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

  function makeShortUrl(overrides: Partial<ShortUrl> = {}): ShortUrl {
    return new ShortUrl({
      id: crypto.randomUUID(),
      url: 'https://example.com',
      shortCode: 'abc123',
      accessCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  }

  it('deve criar short URL com sucesso', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'create01' });

    await repository.create(shortUrl);

    const found = await repository.findByShortCode('create01');
    expect(found).not.toBeNull();
    expect(found?.url).toBe('https://example.com');
    expect(found?.shortCode).toBe('create01');
    expect(found?.accessCount).toBe(0);
  });

  it('deve buscar por shortCode', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'find01' });
    await repository.create(shortUrl);

    const found = await repository.findByShortCode('find01');

    expect(found).not.toBeNull();
    expect(found?.id).toBe(shortUrl.id);
    expect(found?.url).toBe(shortUrl.url);
  });

  it('deve retornar null quando shortCode nao existe', async () => {
    const found = await repository.findByShortCode('naoexiste');
    expect(found).toBeNull();
  });

  it('deve atualizar URL por shortCode', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'update01' });
    await repository.create(shortUrl);

    const updated = await repository.updateUrlByShortCode({
      shortCode: 'update01',
      url: 'https://updated.com',
    });

    expect(updated).not.toBeNull();
    expect(updated?.url).toBe('https://updated.com');
    expect(updated?.shortCode).toBe('update01');
    expect(updated?.accessCount).toBe(0);
  });

  it('deve retornar null ao atualizar shortCode inexistente', async () => {
    const updated = await repository.updateUrlByShortCode({
      shortCode: 'naoexiste',
      url: 'https://any.com',
    });
    expect(updated).toBeNull();
  });

  it('deve deletar por shortCode', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'delete01' });
    await repository.create(shortUrl);

    const deleted = await repository.deleteByShortCode('delete01');

    expect(deleted).toBe(true);
    const found = await repository.findByShortCode('delete01');
    expect(found).toBeNull();
  });

  it('deve retornar false ao deletar shortCode inexistente', async () => {
    const deleted = await repository.deleteByShortCode('naoexiste');
    expect(deleted).toBe(false);
  });

  it('deve incrementar accessCount', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'incr01', accessCount: 0 });
    await repository.create(shortUrl);

    await repository.incrementAccessCount('incr01');
    const after1 = await repository.findByShortCode('incr01');
    expect(after1?.accessCount).toBe(1);

    await repository.incrementAccessCount('incr01');
    const after2 = await repository.findByShortCode('incr01');
    expect(after2?.accessCount).toBe(2);
  });

  it('deve lancar ShortCodeConflictError ao criar shortCode duplicado', async () => {
    const shortUrl = makeShortUrl({ shortCode: 'dup01' });
    await repository.create(shortUrl);

    const duplicate = makeShortUrl({ shortCode: 'dup01', id: crypto.randomUUID() });

    await expect(repository.create(duplicate)).rejects.toThrow(ShortCodeConflictError);
  });
});
