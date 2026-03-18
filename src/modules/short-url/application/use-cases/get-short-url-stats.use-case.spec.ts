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

    expect(result.isSuccess).toBe(true);
    expect(result.value).toMatchObject({
      id: 'some-uuid',
      url: 'https://example.com',
      shortCode: 'abc123',
      accessCount: 42,
    });
    expect(result.value?.createdAt).toBeInstanceOf(Date);
    expect(result.value?.updatedAt).toBeInstanceOf(Date);
    expect(findMock).toHaveBeenCalledWith('abc123', { skipCache: true });
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

    expect(result.value?.accessCount).toBe(7);
  });

  it('deve retornar falha com ShortUrlNotFoundError quando shortCode não existe', async () => {
    const repository = makeRepository({
      findByShortCode: jest.fn().mockResolvedValue(null),
    });
    const useCase = new GetShortUrlStatsUseCase(repository);

    const result = await useCase.execute({ shortCode: 'naoexiste' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ShortUrlNotFoundError);
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
