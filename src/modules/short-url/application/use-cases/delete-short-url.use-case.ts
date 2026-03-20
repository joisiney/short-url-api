import { Injectable, Inject } from '@nestjs/common';
import { Result, ResultUtils } from '@shared/utils/result';

import type { ShortUrlRepository } from '@modules/short-url/domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '@modules/short-url/domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '@modules/short-url/domain/errors/short-url-not-found.error';

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

  async execute(
    input: DeleteShortUrlInput,
  ): Promise<Result<DeleteShortUrlOutput, ShortUrlNotFoundError>> {
    const { shortCode } = input;

    const deleted = await this.shortUrlRepository.deleteByShortCode(shortCode);

    if (!deleted) {
      return ResultUtils.fail(new ShortUrlNotFoundError(shortCode));
    }

    return ResultUtils.ok(undefined);
  }
}
