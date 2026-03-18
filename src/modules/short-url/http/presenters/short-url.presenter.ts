import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlResponse } from '../contracts/short-url.response';
import { ShortUrlStatsResponse } from '../contracts/short-url-stats.response';
import type { CreateShortUrlOutput } from '../../application/use-cases/create-short-url.use-case';
import type { GetShortUrlOutput } from '../../application/use-cases/get-short-url.use-case';

export class ShortUrlPresenter {
  static toResponse(
    data: CreateShortUrlOutput | GetShortUrlOutput | ShortUrl,
  ): ShortUrlResponse {
    const accessCount = 'accessCount' in data ? (data.accessCount ?? 0) : 0;
    return {
      id: data.id,
      url: data.url,
      shortCode: data.shortCode,
      accessCount,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }

  static toStatsResponse(entity: ShortUrl): ShortUrlStatsResponse {
    return {
      shortCode: entity.shortCode,
      url: entity.url,
      accessCount: entity.accessCount,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
