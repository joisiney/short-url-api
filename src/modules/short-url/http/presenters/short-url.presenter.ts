import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlResponse } from '../contracts/short-url.response';
import { ShortUrlStatsResponse } from '../contracts/short-url-stats.response';

export class ShortUrlPresenter {
  static toResponse(entity: ShortUrl): ShortUrlResponse {
    return {
      id: entity.id,
      url: entity.url,
      shortCode: entity.shortCode,
      accessCount: entity.accessCount,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
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
