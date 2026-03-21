import { Injectable, Inject } from '@nestjs/common';

import type { ShortUrlRepository } from '@modules/short-url/domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '@modules/short-url/domain/repositories/short-url.repository';
import { IdGeneratorService } from '@modules/short-url/application/services/id-generator.service';
import { Base62EncoderService } from '@modules/short-url/application/services/base62-encoder.service';
import { ShortCodePermutationService } from '@modules/short-url/application/services/short-code-permutation.service';
import { ShortUrl } from '@modules/short-url/domain/entities/short-url.entity';

export type CreateShortUrlInput = {
  url: string;
};

export type CreateShortUrlOutput = {
  id: string;
  url: string;
  shortCode: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CreateShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
    private readonly idGenerator: IdGeneratorService,
    private readonly shortCodePermutation: ShortCodePermutationService,
    private readonly base62Encoder: Base62EncoderService,
  ) {}

  async execute(input: CreateShortUrlInput): Promise<CreateShortUrlOutput> {
    const { url } = input;

    const existing = await this.shortUrlRepository.findByUrl(url);
    if (existing) {
      return {
        id: existing.id,
        url: existing.url,
        shortCode: existing.shortCode,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    const id = await this.idGenerator.getNextId();
    const permuted = this.shortCodePermutation.permute(id);
    const shortCode = this.base62Encoder.encode(permuted);
    const now = new Date();

    const shortUrl = new ShortUrl({
      id: String(id),
      url,
      shortCode,
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await this.shortUrlRepository.create(shortUrl);

    return {
      id: shortUrl.id,
      url: shortUrl.url,
      shortCode: shortUrl.shortCode,
      createdAt: shortUrl.createdAt,
      updatedAt: shortUrl.updatedAt,
    };
  }
}
