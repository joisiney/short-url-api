import { ShortUrlResponse } from '../contracts/short-url.response';
import { ShortUrlStatsResponse } from '../contracts/short-url-stats.response';
import type { CreateShortUrlOutput } from '../../application/use-cases/create-short-url.use-case';
import type { GetShortUrlOutput } from '../../application/use-cases/get-short-url.use-case';
import type { UpdateShortUrlOutput } from '../../application/use-cases/update-short-url.use-case';
import type { GetShortUrlStatsOutput } from '../../application/use-cases/get-short-url-stats.use-case';

export class ShortUrlPresenter {
  static toResponse(
    data: CreateShortUrlOutput | GetShortUrlOutput | UpdateShortUrlOutput,
  ): ShortUrlResponse {
    const accessCount =
      'accessCount' in data
        ? (((data as Record<string, unknown>).accessCount as number) ?? 0)
        : 0;
    return {
      id: data.id,
      url: data.url,
      shortCode: data.shortCode,
      accessCount,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }

  static toStatsResponse(data: GetShortUrlStatsOutput): ShortUrlStatsResponse {
    return {
      id: data.id,
      shortCode: data.shortCode,
      url: data.url,
      accessCount: data.accessCount,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }
}
