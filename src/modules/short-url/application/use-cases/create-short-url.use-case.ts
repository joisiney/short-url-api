import { Injectable, Inject } from '@nestjs/common';
import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { SHORT_URL_REPOSITORY } from '../../domain/repositories/short-url.repository';
import { ShortCodeGeneratorService } from '../services/short-code-generator.service';
import { ShortUrl } from '../../domain/entities/short-url.entity';

@Injectable()
export class CreateShortUrlUseCase {
  constructor(
    @Inject(SHORT_URL_REPOSITORY)
    private readonly shortUrlRepository: ShortUrlRepository,
    private readonly shortCodeGenerator: ShortCodeGeneratorService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute(_originalUrl: string): ShortUrl {
    // Stub — real logic implemented in ADR 00-07
    throw new Error('Method not implemented.');
  }
}
