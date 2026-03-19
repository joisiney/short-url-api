import { Injectable, Inject } from '@nestjs/common';
import { Result, ResultUtils } from '../../../../shared/utils/result';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { UrlAlreadyShortenedError } from '../../domain/errors/url-already-shortened.error';

export type UpdateShortUrlInput = {
  shortCode: string;
  url: string;
};

export type UpdateShortUrlOutput = {
  id: string;
  url: string;
  shortCode: string;
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateShortUrlError =
  | ShortUrlNotFoundError
  | UrlAlreadyShortenedError;

@Injectable()
export class UpdateShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(
    input: UpdateShortUrlInput,
  ): Promise<Result<UpdateShortUrlOutput, UpdateShortUrlError>> {
    const { shortCode, url } = input;

    const existingByUrl = await this.shortUrlRepository.findByUrl(url);
    if (existingByUrl && existingByUrl.shortCode !== shortCode) {
      return ResultUtils.fail(new UrlAlreadyShortenedError(url));
    }

    const updatedShortUrl = await this.shortUrlRepository.updateUrlByShortCode({
      shortCode,
      url,
    });

    if (!updatedShortUrl) {
      return ResultUtils.fail(new ShortUrlNotFoundError(shortCode));
    }

    return ResultUtils.ok({
      id: updatedShortUrl.id,
      url: updatedShortUrl.url,
      shortCode: updatedShortUrl.shortCode,
      accessCount: updatedShortUrl.accessCount,
      createdAt: updatedShortUrl.createdAt,
      updatedAt: updatedShortUrl.updatedAt,
    });
  }
}
