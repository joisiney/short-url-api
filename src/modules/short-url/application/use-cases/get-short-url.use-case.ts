import { Injectable, Inject } from '@nestjs/common';

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
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GetShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: GetShortUrlInput): Promise<GetShortUrlOutput> {
    const { shortCode } = input;

    const shortUrl = await this.shortUrlRepository.findByShortCode(shortCode);

    if (!shortUrl) {
      throw new ShortUrlNotFoundError(shortCode);
    }

    await this.shortUrlRepository.incrementAccessCount(shortCode);

    return {
      id: shortUrl.id,
      url: shortUrl.url,
      shortCode: shortUrl.shortCode,
      createdAt: shortUrl.createdAt,
      updatedAt: shortUrl.updatedAt,
    };
  }
}
