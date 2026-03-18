import { Injectable, Inject } from '@nestjs/common';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

export type UpdateShortUrlInput = {
  shortCode: string;
  url: string;
};

export type UpdateShortUrlOutput = {
  id: string;
  url: string;
  shortCode: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UpdateShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: UpdateShortUrlInput): Promise<UpdateShortUrlOutput> {
    const { shortCode, url } = input;

    const updatedShortUrl = await this.shortUrlRepository.updateUrlByShortCode({
      shortCode,
      url,
    });

    if (!updatedShortUrl) {
      throw new ShortUrlNotFoundError(shortCode);
    }

    return {
      id: updatedShortUrl.id,
      url: updatedShortUrl.url,
      shortCode: updatedShortUrl.shortCode,
      createdAt: updatedShortUrl.createdAt,
      updatedAt: updatedShortUrl.updatedAt,
    };
  }
}
