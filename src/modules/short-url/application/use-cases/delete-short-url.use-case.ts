import { Injectable, Inject } from '@nestjs/common';

import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

export type DeleteShortUrlInput = {
  shortCode: string;
};

export type DeleteShortUrlOutput = void;

@Injectable()
export class DeleteShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: DeleteShortUrlInput): Promise<DeleteShortUrlOutput> {
    const { shortCode } = input;

    const deleted = await this.shortUrlRepository.deleteByShortCode(shortCode);

    if (!deleted) {
      throw new ShortUrlNotFoundError(shortCode);
    }
  }
}
