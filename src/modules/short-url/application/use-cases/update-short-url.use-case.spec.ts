import { UpdateShortUrlUseCase } from './update-short-url.use-case';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { UrlAlreadyShortenedError } from '../../domain/errors/url-already-shortened.error';

function makeShortUrl(overrides: Partial<ShortUrl> = {}): ShortUrl {
  return new ShortUrl({
    id: 'some-uuid',
    url: 'https://example.com',
    shortCode: 'abc123',
    accessCount: 5,
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
    findByUrl: jest.fn().mockResolvedValue(null),
    findByShortCode: jest.fn(),
    incrementAccessCount: jest.fn(),
    updateUrlByShortCode: jest.fn().mockResolvedValue(null),
    deleteByShortCode: jest.fn(),
    ...overrides,
  };
}

describe('UpdateShortUrlUseCase', () => {
  it('deve atualizar a URL original com sucesso usando o repositório especializado', async () => {
    const updatedEntity = makeShortUrl({
      url: 'https://updated.com',
      updatedAt: new Date(),
    });
    const updateMock = jest.fn().mockResolvedValue(updatedEntity);
    const repository = makeRepository({
      updateUrlByShortCode: updateMock,
    });
    const useCase = new UpdateShortUrlUseCase(repository);

    const result = await useCase.execute({
      shortCode: 'abc123',
      url: 'https://updated.com',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.url).toBe('https://updated.com');
    expect(result.value?.shortCode).toBe('abc123');
    expect(result.value?.id).toBe(updatedEntity.id);
    expect(result.value?.accessCount).toBe(updatedEntity.accessCount);
    expect(result.value?.createdAt).toEqual(updatedEntity.createdAt);
    expect(updateMock).toHaveBeenCalledWith({
      shortCode: 'abc123',
      url: 'https://updated.com',
    });
  });

  it('deve retornar falha com UrlAlreadyShortenedError quando a nova URL ja pertence a outro shortCode', async () => {
    const existingByUrl = makeShortUrl({
      shortCode: 'other1',
      url: 'https://already-shortened.com',
    });
    const repository = makeRepository({
      findByUrl: jest.fn().mockResolvedValue(existingByUrl),
    });
    const useCase = new UpdateShortUrlUseCase(repository);

    const result = await useCase.execute({
      shortCode: 'abc123',
      url: 'https://already-shortened.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(UrlAlreadyShortenedError);
  });

  it('deve retornar falha com ShortUrlNotFoundError quando o repositório retorna null (não encontrado)', async () => {
    const repository = makeRepository({
      updateUrlByShortCode: jest.fn().mockResolvedValue(null),
    });
    const useCase = new UpdateShortUrlUseCase(repository);

    const result = await useCase.execute({
      shortCode: 'n0p3',
      url: 'https://any.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ShortUrlNotFoundError);
  });

  it('deve propagar erro inesperado do repositório', async () => {
    const unexpectedError = new Error('DB unavailable');
    const repository = makeRepository({
      updateUrlByShortCode: jest.fn().mockRejectedValue(unexpectedError),
    });
    const useCase = new UpdateShortUrlUseCase(repository);

    await expect(
      useCase.execute({ shortCode: 'abc123', url: 'https://any.com' }),
    ).rejects.toBe(unexpectedError);
  });
});
