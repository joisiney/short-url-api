import { ShortUrlResponse } from '@modules/short-url/http/contracts/short-url.response';
import { ShortUrlStatsResponse } from '@modules/short-url/http/contracts/short-url-stats.response';
import type { CreateShortUrlOutput } from '@modules/short-url/application/use-cases/create-short-url.use-case';
import type { GetShortUrlOutput } from '@modules/short-url/application/use-cases/get-short-url.use-case';
import type { UpdateShortUrlOutput } from '@modules/short-url/application/use-cases/update-short-url.use-case';
import type { GetShortUrlStatsOutput } from '@modules/short-url/application/use-cases/get-short-url-stats.use-case';

export class ShortUrlPresenter {
  static toResponse(
    data: CreateShortUrlOutput | GetShortUrlOutput | UpdateShortUrlOutput,
  ): ShortUrlResponse {
    return {
      id: data.id,
      url: data.url,
      shortCode: data.shortCode,
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
