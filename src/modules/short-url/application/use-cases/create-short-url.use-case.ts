import { Injectable, Inject } from '@nestjs/common';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { IdGeneratorService } from '../services/id-generator.service';
import { Base62EncoderService } from '../services/base62-encoder.service';
import { ShortUrl } from '../../domain/entities/short-url.entity';

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
    const shortCode = this.base62Encoder.encode(id);
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
