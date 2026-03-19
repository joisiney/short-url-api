import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../src/config/config.module';
import { DatabaseModule } from '../src/infra/database/database.module';
import { DrizzleShortUrlRepository } from '../src/modules/short-url/infra/repositories/drizzle-short-url.repository';
import { ShortUrl } from '../src/modules/short-url/domain/entities/short-url.entity';
import { createTestDb } from './helpers/db-test.helper';

describe('Concorrencia (integration)', () => {
  let repository: DrizzleShortUrlRepository;
  let testDb: ReturnType<typeof createTestDb>;

  beforeAll(async () => {
    testDb = createTestDb();
    await testDb.runMigrations();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule],
      providers: [DrizzleShortUrlRepository],
    }).compile();

    await module.init();
    repository = module.get(DrizzleShortUrlRepository);
  });

  beforeEach(async () => {
    await testDb.truncateShortUrls();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('deve incrementar accessCount corretamente em acessos concorrentes', async () => {
    const shortUrl = new ShortUrl({
      id: '14000000',
      url: 'https://example.com',
      shortCode: 'conc1',
      accessCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await repository.create(shortUrl);

    const concurrency = 50;
    const promises = Array.from({ length: concurrency }, () =>
      repository.incrementAccessCount('conc1'),
    );
    await Promise.all(promises);

    const found = await repository.findByShortCode('conc1');
    expect(found?.accessCount).toBe(concurrency);
  });

  it('deve rejeitar criacao com shortCode duplicado', async () => {
    const shortUrl = new ShortUrl({
      id: '14000000',
      url: 'https://example.com',
      shortCode: 'col1',
      accessCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await repository.create(shortUrl);

    const duplicate = new ShortUrl({
      id: '14000001',
      url: 'https://other.com',
      shortCode: 'col1',
      accessCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(repository.create(duplicate)).rejects.toThrow();
  });
});
