import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Result, ResultUtils } from '../../../../shared/utils/result';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortCodeGeneratorService } from '../services/short-code-generator.service';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortCodeConflictError } from '../../domain/errors/short-code-conflict.error';
import { ShortCodeGenerationExhaustedError } from '../../domain/errors/short-code-generation-exhausted.error';

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

const MAX_ATTEMPTS = 5;

@Injectable()
export class CreateShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
    private readonly shortCodeGenerator: ShortCodeGeneratorService,
  ) {}

  async execute(
    input: CreateShortUrlInput,
  ): Promise<Result<CreateShortUrlOutput, ShortCodeGenerationExhaustedError>> {
    const { url } = input;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const shortCode = this.shortCodeGenerator.generateCode();
      const now = new Date();

      const shortUrl = new ShortUrl({
        id: randomUUID(),
        url,
        shortCode,
        accessCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      try {
        await this.shortUrlRepository.create(shortUrl);

        return ResultUtils.ok({
          id: shortUrl.id,
          url: shortUrl.url,
          shortCode: shortUrl.shortCode,
          createdAt: shortUrl.createdAt,
          updatedAt: shortUrl.updatedAt,
        });
      } catch (error) {
        if (error instanceof ShortCodeConflictError) {
          // retry with a new code on the next iteration
          continue;
        }
        // unexpected persistence error — propagate immediately
        throw error;
      }
    }

    return ResultUtils.fail(
      new ShortCodeGenerationExhaustedError(MAX_ATTEMPTS),
    );
  }
}
