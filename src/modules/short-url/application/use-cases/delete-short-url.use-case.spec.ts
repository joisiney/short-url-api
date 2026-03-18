import { DeleteShortUrlUseCase } from './delete-short-url.use-case';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

function makeRepository(
  overrides: Partial<ShortUrlRepository> = {},
): ShortUrlRepository {
  return {
    create: jest.fn(),
    findByShortCode: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    incrementAccessCount: jest.fn(),
    updateUrlByShortCode: jest.fn(),
    deleteByShortCode: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('DeleteShortUrlUseCase', () => {
  it('deve deletar uma short URL com sucesso usando o repositório especializado', async () => {
    const deleteMock = jest.fn().mockResolvedValue(true);
    const repository = makeRepository({
      deleteByShortCode: deleteMock,
    });
    const useCase = new DeleteShortUrlUseCase(repository);

    const result = await useCase.execute({ shortCode: 'abc123' });

    expect(result).toBeUndefined();
    expect(deleteMock).toHaveBeenCalledWith('abc123');
  });

  it('deve lançar ShortUrlNotFoundError quando o repositório retorna false (não encontrado)', async () => {
    const repository = makeRepository({
      deleteByShortCode: jest.fn().mockResolvedValue(false),
    });
    const useCase = new DeleteShortUrlUseCase(repository);

    await expect(
      useCase.execute({ shortCode: 'naoexiste' }),
    ).rejects.toBeInstanceOf(ShortUrlNotFoundError);
  });

  it('deve propagar erro inesperado do repositório', async () => {
    const unexpectedError = new Error('DB unavailable');
    const repository = makeRepository({
      deleteByShortCode: jest.fn().mockRejectedValue(unexpectedError),
    });
    const useCase = new DeleteShortUrlUseCase(repository);

    await expect(useCase.execute({ shortCode: 'abc123' })).rejects.toBe(
      unexpectedError,
    );
  });
});
