import { NotFoundException } from '@nestjs/common';

import { ShortenController } from './shorten.controller';
import { CreateShortUrlUseCase } from '../../application/use-cases/create-short-url.use-case';
import { GetShortUrlUseCase } from '../../application/use-cases/get-short-url.use-case';
import { UpdateShortUrlUseCase } from '../../application/use-cases/update-short-url.use-case';
import { DeleteShortUrlUseCase } from '../../application/use-cases/delete-short-url.use-case';
import { GetShortUrlStatsUseCase } from '../../application/use-cases/get-short-url-stats.use-case';
import { ResultUtils } from '../../../../shared/utils/result';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

describe('ShortenController', () => {
  function makeSut() {
    const createExecute = jest.fn();
    const getExecute = jest.fn();
    const updateExecute = jest.fn();
    const deleteExecute = jest.fn();
    const statsExecute = jest.fn();

    const createShortUrl = {
      execute: createExecute,
    } as unknown as CreateShortUrlUseCase;
    const getShortUrl = {
      execute: getExecute,
    } as unknown as GetShortUrlUseCase;
    const updateShortUrl = {
      execute: updateExecute,
    } as unknown as UpdateShortUrlUseCase;
    const deleteShortUrl = {
      execute: deleteExecute,
    } as unknown as DeleteShortUrlUseCase;
    const getShortUrlStats = {
      execute: statsExecute,
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
      createExecute,
      getExecute,
      updateExecute,
      deleteExecute,
      statsExecute,
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
    const { controller, createExecute } = makeSut();
    createExecute.mockResolvedValue(baseOutput);

    const result = await controller.create({ url: 'https://example.com' });

    expect(createExecute).toHaveBeenCalledWith({
      url: 'https://example.com',
    });
    expect(result).toMatchObject({
      id: baseOutput.id,
      url: baseOutput.url,
      shortCode: baseOutput.shortCode,
    });
  });

  it('deve_retornar_erro_not_found_quando_findOne_nao_encontrar', async () => {
    const { controller, getExecute } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    getExecute.mockResolvedValue(ResultUtils.fail(domainError));

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve_retornar_short_url_quando_update_sucesso', async () => {
    const { controller, updateExecute } = makeSut();
    updateExecute.mockResolvedValue(ResultUtils.ok(baseOutput));

    const result = await controller.update('abc123', {
      url: 'https://example.com/updated',
    });

    expect(updateExecute).toHaveBeenCalledWith({
      shortCode: 'abc123',
      url: 'https://example.com/updated',
    });
    expect(result.url).toBe(baseOutput.url);
  });

  it('deve_retornar_erro_not_found_quando_update_nao_encontrar', async () => {
    const { controller, updateExecute } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    updateExecute.mockResolvedValue(ResultUtils.fail(domainError));

    await expect(
      controller.update('missing', { url: 'https://any.com' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve_executar_delete_quando_remove_sucesso', async () => {
    const { controller, deleteExecute } = makeSut();
    deleteExecute.mockResolvedValue(
      ResultUtils.ok<void, never>(undefined as never),
    );

    await controller.remove('abc123');

    expect(deleteExecute).toHaveBeenCalledWith({
      shortCode: 'abc123',
    });
  });

  it('deve_retornar_erro_not_found_quando_remove_nao_encontrar', async () => {
    const { controller, deleteExecute } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    deleteExecute.mockResolvedValue(ResultUtils.fail(domainError));

    await expect(controller.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve_retornar_stats_quando_stats_sucesso', async () => {
    const { controller, statsExecute } = makeSut();
    const statsOutput = {
      ...baseOutput,
      accessCount: 10,
    };
    statsExecute.mockResolvedValue(ResultUtils.ok(statsOutput));

    const result = await controller.stats('abc123');

    expect(statsExecute).toHaveBeenCalledWith({
      shortCode: 'abc123',
    });
    expect(result.accessCount).toBe(10);
  });

  it('deve_retornar_erro_not_found_quando_stats_nao_encontrar', async () => {
    const { controller, statsExecute } = makeSut();
    const domainError = new ShortUrlNotFoundError('missing');
    statsExecute.mockResolvedValue(ResultUtils.fail(domainError));

    await expect(controller.stats('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve_retornar_short_url_quando_findOne_sucesso', async () => {
    const { controller, getExecute } = makeSut();
    getExecute.mockResolvedValue(ResultUtils.ok(baseOutput));

    const result = await controller.findOne('abc123');

    expect(getExecute).toHaveBeenCalledWith({ shortCode: 'abc123' });
    expect(result).toMatchObject({
      id: baseOutput.id,
      url: baseOutput.url,
      shortCode: baseOutput.shortCode,
    });
  });
});
