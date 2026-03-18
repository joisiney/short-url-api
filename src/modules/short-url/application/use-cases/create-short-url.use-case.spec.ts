jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'mocked-code',
}));

import { CreateShortUrlUseCase } from './create-short-url.use-case';
import { ShortCodeGeneratorService } from '../services/short-code-generator.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortCodeConflictError } from '../../domain/errors/short-code-conflict.error';
import { ShortCodeGenerationExhaustedError } from '../../domain/errors/short-code-generation-exhausted.error';

const MAX_ATTEMPTS = 5;

function makeRepository(
  overrides: Partial<ShortUrlRepository> = {},
): ShortUrlRepository {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    findByShortCode: jest.fn(),
    incrementAccessCount: jest.fn(),
    updateUrlByShortCode: jest.fn(),
    deleteByShortCode: jest.fn(),
    ...overrides,
  };
}

function makeGenerator(code = 'abc123'): ShortCodeGeneratorService {
  return {
    generateCode: jest.fn().mockReturnValue(code),
  } as unknown as ShortCodeGeneratorService;
}

describe('CreateShortUrlUseCase', () => {
  it('deve criar uma short URL com sucesso', async () => {
    const createMock = jest.fn().mockResolvedValue(undefined);
    const repository = makeRepository({ create: createMock });
    const generator = makeGenerator('abc123');
    const useCase = new CreateShortUrlUseCase(repository, generator);

    const result = await useCase.execute({ url: 'https://example.com' });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toMatchObject({
      url: 'https://example.com',
      shortCode: 'abc123',
    });
    expect(result.value?.id).toBeDefined();
    expect(result.value?.createdAt).toBeInstanceOf(Date);
    expect(result.value?.updatedAt).toBeInstanceOf(Date);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('deve retornar createdAt e updatedAt iguais na criação', async () => {
    const repository = makeRepository();
    const generator = makeGenerator('xyz999');
    const useCase = new CreateShortUrlUseCase(repository, generator);

    const result = await useCase.execute({ url: 'https://example.com/path' });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.createdAt.getTime()).toBe(result.value?.updatedAt.getTime());
  });

  it('deve fazer retry quando houver colisão de shortCode', async () => {
    const generator = makeGenerator();
    jest
      .spyOn(generator, 'generateCode')
      .mockReturnValueOnce('colide1')
      .mockReturnValue('unico22');

    const createMock = jest
      .fn()
      .mockRejectedValueOnce(new ShortCodeConflictError('colide1'))
      .mockResolvedValue(undefined);

    const repository = makeRepository({ create: createMock });

    const useCase = new CreateShortUrlUseCase(repository, generator);
    const result = await useCase.execute({ url: 'https://example.com' });

    expect(result.isSuccess).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(result.value?.shortCode).toBe('unico22');
  });

  it(`deve retornar falha com ShortCodeGenerationExhaustedError após ${MAX_ATTEMPTS} tentativas`, async () => {
    const createMock = jest
      .fn()
      .mockRejectedValue(new ShortCodeConflictError('xpto99'));
    const repository = makeRepository({ create: createMock });
    const generator = makeGenerator('xpto99');
    const useCase = new CreateShortUrlUseCase(repository, generator);

    const result = await useCase.execute({ url: 'https://example.com' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ShortCodeGenerationExhaustedError);
    expect(createMock).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it('deve propagar erro inesperado do repositório sem retry', async () => {
    const unexpectedError = new Error('DB unavailable');
    const createMock = jest.fn().mockRejectedValue(unexpectedError);
    const repository = makeRepository({ create: createMock });
    const generator = makeGenerator('abc123');
    const useCase = new CreateShortUrlUseCase(repository, generator);

    await expect(useCase.execute({ url: 'https://example.com' })).rejects.toBe(
      unexpectedError,
    );

    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
