import { Injectable, Inject } from '@nestjs/common';
import { Result, ResultUtils } from '../../../../shared/utils/result';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

export type GetShortUrlInput = {
  shortCode: string;
};

export type GetShortUrlOutput = {
  id: string;
  url: string;
  shortCode: string;
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GetShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(
    input: GetShortUrlInput,
  ): Promise<Result<GetShortUrlOutput, ShortUrlNotFoundError>> {
    const { shortCode } = input;

    const shortUrl = await this.shortUrlRepository.findByShortCode(shortCode);

    if (!shortUrl) {
      return ResultUtils.fail(new ShortUrlNotFoundError(shortCode));
    }

    await this.shortUrlRepository.incrementAccessCount(shortCode);

    return ResultUtils.ok({
      id: shortUrl.id,
      url: shortUrl.url,
      shortCode: shortUrl.shortCode,
      accessCount: shortUrl.accessCount + 1,
      createdAt: shortUrl.createdAt,
      updatedAt: shortUrl.updatedAt,
    });
  }
}
