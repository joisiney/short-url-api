import { GetShortUrlStatsUseCase } from './get-short-url-stats.use-case';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

function makeShortUrl(overrides: Partial<ShortUrl> = {}): ShortUrl {
  return new ShortUrl({
    id: 'some-uuid',
    url: 'https://example.com',
    shortCode: 'abc123',
    accessCount: 42,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  });
}

function makeRepository(
  overrides: Partial<ShortUrlRepository> = {},
): ShortUrlRepository {
  return {
    create: jest.fn(),
    findByShortCode: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
    delete: jest.fn(),
    incrementAccessCount: jest.fn(),
    updateUrlByShortCode: jest.fn(),
    deleteByShortCode: jest.fn(),
    ...overrides,
  };
}

describe('GetShortUrlStatsUseCase', () => {
  it('deve retornar as estatísticas completas com accessCount correto', async () => {
    const entity = makeShortUrl({ accessCount: 42 });
    const findMock = jest.fn().mockResolvedValue(entity);
    const repository = makeRepository({ findByShortCode: findMock });
    const useCase = new GetShortUrlStatsUseCase(repository);

    const result = await useCase.execute({ shortCode: 'abc123' });

    expect(result).toMatchObject({
      id: 'some-uuid',
      url: 'https://example.com',
      shortCode: 'abc123',
      accessCount: 42,
    });
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(findMock).toHaveBeenCalledWith('abc123');
  });

  it('não deve incrementar accessCount ao consultar estatísticas', async () => {
    const entity = makeShortUrl({ accessCount: 10 });
    const incrementMock = jest.fn();
    const repository = makeRepository({
      findByShortCode: jest.fn().mockResolvedValue(entity),
      incrementAccessCount: incrementMock,
    });
    const useCase = new GetShortUrlStatsUseCase(repository);

    await useCase.execute({ shortCode: 'abc123' });

    expect(incrementMock).not.toHaveBeenCalled();
  });

  it('deve retornar o accessCount persistido sem alteração', async () => {
    const entity = makeShortUrl({ accessCount: 7 });
    const repository = makeRepository({
      findByShortCode: jest.fn().mockResolvedValue(entity),
    });
    const useCase = new GetShortUrlStatsUseCase(repository);

    const result = await useCase.execute({ shortCode: 'abc123' });

    expect(result.accessCount).toBe(7);
  });

  it('deve lançar ShortUrlNotFoundError quando shortCode não existe', async () => {
    const repository = makeRepository({
      findByShortCode: jest.fn().mockResolvedValue(null),
    });
    const useCase = new GetShortUrlStatsUseCase(repository);

    await expect(
      useCase.execute({ shortCode: 'naoexiste' }),
    ).rejects.toBeInstanceOf(ShortUrlNotFoundError);
  });

  it('deve propagar erro inesperado do repositório', async () => {
    const unexpectedError = new Error('DB connection failed');
    const repository = makeRepository({
      findByShortCode: jest.fn().mockRejectedValue(unexpectedError),
    });
    const useCase = new GetShortUrlStatsUseCase(repository);

    await expect(useCase.execute({ shortCode: 'abc123' })).rejects.toBe(
      unexpectedError,
    );
  });
});
