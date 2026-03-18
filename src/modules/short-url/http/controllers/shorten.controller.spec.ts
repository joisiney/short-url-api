jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'mocked-code',
}));

import { ConflictException, NotFoundException } from '@nestjs/common';

import { ShortenController } from './shorten.controller';
import { CreateShortUrlUseCase } from '../../application/use-cases/create-short-url.use-case';
import { GetShortUrlUseCase } from '../../application/use-cases/get-short-url.use-case';
import { UpdateShortUrlUseCase } from '../../application/use-cases/update-short-url.use-case';
import { DeleteShortUrlUseCase } from '../../application/use-cases/delete-short-url.use-case';
import { GetShortUrlStatsUseCase } from '../../application/use-cases/get-short-url-stats.use-case';
import { ResultUtils } from '../../../../shared/utils/result';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { ShortCodeGenerationExhaustedError } from '../../domain/errors/short-code-generation-exhausted.error';

describe('ShortenController', () => {
  function makeSut() {
    const createShortUrl = {
      execute: jest.fn(),
    } as unknown as CreateShortUrlUseCase;
    const getShortUrl = {
      execute: jest.fn(),
    } as unknown as GetShortUrlUseCase;
    const updateShortUrl = {
      execute: jest.fn(),
    } as unknown as UpdateShortUrlUseCase;
    const deleteShortUrl = {
      execute: jest.fn(),
    } as unknown as DeleteShortUrlUseCase;
    const getShortUrlStats = {
      execute: jest.fn(),
    } as unknown as GetShortUrlStatsUseCase;

    const controller = new ShortenController(
      createShortUrl,
      getShortUrl,
      updateShortUrl,
      deleteShortUrl,
      getShortUrlStats,
    );

    return {
      controller,
      createShortUrl,
      getShortUrl,
      updateShortUrl,
      deleteShortUrl,
      getShortUrlStats,
    };
  }

  const baseOutput = {
    id: 'some-uuid',
    url: 'https://example.com',
    shortCode: 'abc123',
    accessCount: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('deve_retornar_short_url_quando_create_sucesso', async () => {
    const { controller, createShortUrl } = makeSut();
    (createShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.ok(baseOutput),
    );

    const result = await controller.create({ url: 'https://example.com' });

    expect(createShortUrl.execute).toHaveBeenCalledWith({
      url: 'https://example.com',
    });
    expect(result).toMatchObject({
      id: baseOutput.id,
      url: baseOutput.url,
      shortCode: baseOutput.shortCode,
      accessCount: 0,
    });
  });

  it('deve_retornar_erro_conflict_quando_create_exaurir_tentativas', async () => {
    const { controller, createShortUrl } = makeSut();
    const domainError = new ShortCodeGenerationExhaustedError(5);
    (createShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.fail(domainError),
    );

    await expect(
      controller.create({ url: 'https://example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deve_retornar_erro_not_found_quando_findOne_nao_encontrar', async () => {
    const { controller, getShortUrl } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');

    (getShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.fail(domainError),
    );

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve_retornar_short_url_quando_update_sucesso', async () => {
    const { controller, updateShortUrl } = makeSut();
    (updateShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.ok(baseOutput),
    );

    const result = await controller.update('abc123', {
      url: 'https://example.com/updated',
    });

    expect(updateShortUrl.execute).toHaveBeenCalledWith({
      shortCode: 'abc123',
      url: 'https://example.com/updated',
    });
    expect(result.url).toBe(baseOutput.url);
  });

  it('deve_retornar_erro_not_found_quando_update_nao_encontrar', async () => {
    const { controller, updateShortUrl } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    (updateShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.fail(domainError),
    );

    await expect(
      controller.update('missing', { url: 'https://any.com' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve_executar_delete_quando_remove_sucesso', async () => {
    const { controller, deleteShortUrl } = makeSut();
    (deleteShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.ok<void, never>(undefined as never),
    );

    await controller.remove('abc123');

    expect(deleteShortUrl.execute).toHaveBeenCalledWith({
      shortCode: 'abc123',
    });
  });

  it('deve_retornar_erro_not_found_quando_remove_nao_encontrar', async () => {
    const { controller, deleteShortUrl } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    (deleteShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.fail(domainError),
    );

    await expect(controller.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve_retornar_stats_quando_stats_sucesso', async () => {
    const { controller, getShortUrlStats } = makeSut();
    const statsOutput = {
      ...baseOutput,
      accessCount: 10,
    };
    (getShortUrlStats.execute as jest.Mock).mockResolvedValue(
      ResultUtils.ok(statsOutput),
    );

    const result = await controller.stats('abc123');

    expect(getShortUrlStats.execute).toHaveBeenCalledWith({
      shortCode: 'abc123',
    });
    expect(result.accessCount).toBe(10);
  });

  it('deve_retornar_erro_not_found_quando_stats_nao_encontrar', async () => {
    const { controller, getShortUrlStats } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    (getShortUrlStats.execute as jest.Mock).mockResolvedValue(
      ResultUtils.fail(domainError),
    );

    await expect(controller.stats('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve_retornar_short_url_quando_findOne_sucesso', async () => {
    const { controller, getShortUrl } = makeSut();
    (getShortUrl.execute as jest.Mock).mockResolvedValue(
      ResultUtils.ok(baseOutput),
    );

    const result = await controller.findOne('abc123');

    expect(getShortUrl.execute).toHaveBeenCalledWith({ shortCode: 'abc123' });
    expect(result).toMatchObject({
      id: baseOutput.id,
      url: baseOutput.url,
      shortCode: baseOutput.shortCode,
    });
  });
});

