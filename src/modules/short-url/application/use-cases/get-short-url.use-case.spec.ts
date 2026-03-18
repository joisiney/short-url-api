import { GetShortUrlUseCase } from './get-short-url.use-case';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

function makeShortUrl(overrides: Partial<ShortUrl> = {}): ShortUrl {
  return new ShortUrl({
    id: 'some-uuid',
    url: 'https://example.com',
    shortCode: 'abc123',
    accessCount: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
}

function makeRepository(
  overrides: Partial<ShortUrlRepository> = {},
): ShortUrlRepository {
  return {
    create: jest.fn(),
    findByShortCode: jest.fn().mockResolvedValue(null),
    incrementAccessCount: jest.fn().mockResolvedValue(undefined),
    updateUrlByShortCode: jest.fn(),
    deleteByShortCode: jest.fn(),
    ...overrides,
  };
}

describe('GetShortUrlUseCase', () => {
  it('deve retornar a short URL e incrementar accessCount ao encontrar', async () => {
    const entity = makeShortUrl();
    const findMock = jest.fn().mockResolvedValue(entity);
    const incrementMock = jest.fn().mockResolvedValue(undefined);
    const repository = makeRepository({
      findByShortCode: findMock,
      incrementAccessCount: incrementMock,
    });
    const useCase = new GetShortUrlUseCase(repository);

    const result = await useCase.execute({ shortCode: 'abc123' });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toMatchObject({
      id: 'some-uuid',
      url: 'https://example.com',
      shortCode: 'abc123',
    });
    expect(result.value?.createdAt).toBeInstanceOf(Date);
    expect(result.value?.updatedAt).toBeInstanceOf(Date);
    expect(findMock).toHaveBeenCalledWith('abc123');
    expect(incrementMock).toHaveBeenCalledWith('abc123');
  });

  it('deve retornar falha com ShortUrlNotFoundError quando shortCode não existe', async () => {
    const findMock = jest.fn().mockResolvedValue(null);
    const incrementMock = jest.fn();
    const repository = makeRepository({
      findByShortCode: findMock,
      incrementAccessCount: incrementMock,
    });
    const useCase = new GetShortUrlUseCase(repository);

    const result = await useCase.execute({ shortCode: 'naoexiste' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ShortUrlNotFoundError);
    expect(incrementMock).not.toHaveBeenCalled();
  });

  it('deve propagar erro inesperado do findByShortCode', async () => {
    const unexpectedError = new Error('DB connection failed');
    const findMock = jest.fn().mockRejectedValue(unexpectedError);
    const incrementMock = jest.fn();
    const repository = makeRepository({
      findByShortCode: findMock,
      incrementAccessCount: incrementMock,
    });
    const useCase = new GetShortUrlUseCase(repository);

    await expect(useCase.execute({ shortCode: 'abc123' })).rejects.toBe(
      unexpectedError,
    );

    expect(incrementMock).not.toHaveBeenCalled();
  });

  it('deve propagar erro inesperado do incrementAccessCount', async () => {
    const entity = makeShortUrl();
    const unexpectedError = new Error('Failed to increment');
    const findMock = jest.fn().mockResolvedValue(entity);
    const incrementMock = jest.fn().mockRejectedValue(unexpectedError);
    const repository = makeRepository({
      findByShortCode: findMock,
      incrementAccessCount: incrementMock,
    });
    const useCase = new GetShortUrlUseCase(repository);

    await expect(useCase.execute({ shortCode: 'abc123' })).rejects.toBe(
      unexpectedError,
    );
  });
});
