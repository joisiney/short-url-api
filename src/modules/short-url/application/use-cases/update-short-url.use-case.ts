import { Injectable, Inject } from '@nestjs/common';
import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';

@Injectable()
export class UpdateShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute(_shortCode: string, _newOriginalUrl: string): ShortUrl {
    // Stub — real logic implemented in ADR 00-08
    throw new Error('Method not implemented.');
  }
}
