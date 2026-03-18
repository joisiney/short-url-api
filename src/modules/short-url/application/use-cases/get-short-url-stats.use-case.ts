import { Injectable, Inject } from '@nestjs/common';
import { Result, ResultUtils } from '../../../../shared/utils/result';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

export type GetShortUrlStatsInput = {
  shortCode: string;
};

export type GetShortUrlStatsOutput = {
  id: string;
  url: string;
  shortCode: string;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
};

@Injectable()
export class GetShortUrlStatsUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(
    input: GetShortUrlStatsInput,
  ): Promise<Result<GetShortUrlStatsOutput, ShortUrlNotFoundError>> {
    const { shortCode } = input;

    const shortUrl = await this.shortUrlRepository.findByShortCode(shortCode);

    if (!shortUrl) {
      return ResultUtils.fail(new ShortUrlNotFoundError(shortCode));
    }

    // Pure read — does NOT increment accessCount (per ADR rule 1)
    return ResultUtils.ok({
      id: shortUrl.id,
      url: shortUrl.url,
      shortCode: shortUrl.shortCode,
      createdAt: shortUrl.createdAt,
      updatedAt: shortUrl.updatedAt,
      accessCount: shortUrl.accessCount,
    });
  }
}
