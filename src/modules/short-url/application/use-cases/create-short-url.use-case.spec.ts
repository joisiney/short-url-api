import { CreateShortUrlUseCase } from './create-short-url.use-case';
import { IdGeneratorService } from '@modules/short-url/application/services/id-generator.service';
import { Base62EncoderService } from '@modules/short-url/application/services/base62-encoder.service';
import { ShortCodePermutationService } from '@modules/short-url/application/services/short-code-permutation.service';
import { ShortUrlRepository } from '@modules/short-url/domain/repositories/short-url.repository';
import { ShortUrl } from '@modules/short-url/domain/entities/short-url.entity';

function makeRepository(
  overrides: Partial<ShortUrlRepository> = {},
): ShortUrlRepository {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    findByUrl: jest.fn().mockResolvedValue(null),
    findByShortCode: jest.fn(),
    incrementAccessCount: jest.fn(),
    updateUrlByShortCode: jest.fn(),
    deleteByShortCode: jest.fn(),
    ...overrides,
  };
}

function makeIdGenerator(id = 14_000_000): IdGeneratorService {
  return {
    getNextId: jest.fn().mockResolvedValue(id),
  } as unknown as IdGeneratorService;
}

function makeBase62Encoder(encoded = '7bKM'): Base62EncoderService {
  return {
    encode: jest.fn().mockReturnValue(encoded),
  } as unknown as Base62EncoderService;
}

function makeShortCodePermutation(
  permuted = 14_000_001,
): ShortCodePermutationService {
  return {
    permute: jest.fn().mockReturnValue(permuted),
  } as unknown as ShortCodePermutationService;
}

describe('CreateShortUrlUseCase', () => {
  it('deve criar uma short URL com sucesso', async () => {
    const createMock = jest.fn().mockResolvedValue(undefined);
    const repository = makeRepository({ create: createMock });
    const idGenerator = makeIdGenerator(14_000_001);
    const shortCodePermutation = makeShortCodePermutation(14_000_001);
    const base62Encoder = makeBase62Encoder('WK2t');
    const useCase = new CreateShortUrlUseCase(
      repository,
      idGenerator,
      shortCodePermutation,
      base62Encoder,
    );

    const result = await useCase.execute({ url: 'https://example.com' });

    expect(result).toMatchObject({
      url: 'https://example.com',
      shortCode: 'WK2t',
    });
    expect(result.id).toBe('14000001');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '14000001',
        shortCode: 'WK2t',
        url: 'https://example.com',
        accessCount: 0,
      }),
    );
  });

  it('deve retornar createdAt e updatedAt iguais na criacao', async () => {
    const repository = makeRepository();
    const idGenerator = makeIdGenerator(14_000_000);
    const shortCodePermutation = makeShortCodePermutation(14_000_000);
    const base62Encoder = makeBase62Encoder('WK2s');
    const useCase = new CreateShortUrlUseCase(
      repository,
      idGenerator,
      shortCodePermutation,
      base62Encoder,
    );

    const result = await useCase.execute({ url: 'https://example.com/path' });

    expect(result.createdAt.getTime()).toBe(result.updatedAt.getTime());
  });

  it('deve retornar shortCode existente quando URL ja foi encurtada (idempotente)', async () => {
    const existingShortUrl = new ShortUrl({
      id: '1',
      url: 'https://example.com',
      shortCode: 'abc12',
      accessCount: 0,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });
    const findByUrlMock = jest.fn().mockResolvedValue(existingShortUrl);
    const createMock = jest.fn().mockResolvedValue(undefined);
    const repository = makeRepository({
      findByUrl: findByUrlMock,
      create: createMock,
    });
    const idGenerator = makeIdGenerator();
    const shortCodePermutation = makeShortCodePermutation();
    const base62Encoder = makeBase62Encoder();
    const useCase = new CreateShortUrlUseCase(
      repository,
      idGenerator,
      shortCodePermutation,
      base62Encoder,
    );

    const result = await useCase.execute({ url: 'https://example.com' });

    expect(result).toMatchObject({
      url: 'https://example.com',
      shortCode: 'abc12',
    });
    expect(findByUrlMock).toHaveBeenCalledWith('https://example.com');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('deve propagar erro do repositorio', async () => {
    const unexpectedError = new Error('DB unavailable');
    const createMock = jest.fn().mockRejectedValue(unexpectedError);
    const repository = makeRepository({ create: createMock });
    const idGenerator = makeIdGenerator();
    const shortCodePermutation = makeShortCodePermutation();
    const base62Encoder = makeBase62Encoder();
    const useCase = new CreateShortUrlUseCase(
      repository,
      idGenerator,
      shortCodePermutation,
      base62Encoder,
    );

    await expect(useCase.execute({ url: 'https://example.com' })).rejects.toBe(
      unexpectedError,
    );

    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
