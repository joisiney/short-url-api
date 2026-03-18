import { Module } from '@nestjs/common';

import { ShortenController } from './http/controllers/shorten.controller';

import { CreateShortUrlUseCase } from './application/use-cases/create-short-url.use-case';
import { GetShortUrlUseCase } from './application/use-cases/get-short-url.use-case';
import { UpdateShortUrlUseCase } from './application/use-cases/update-short-url.use-case';
import { DeleteShortUrlUseCase } from './application/use-cases/delete-short-url.use-case';
import { GetShortUrlStatsUseCase } from './application/use-cases/get-short-url-stats.use-case';
import { ShortCodeGeneratorService } from './application/services/short-code-generator.service';

import { DrizzleShortUrlRepository } from './infra/repositories/drizzle-short-url.repository';
import { SHORT_URL_REPOSITORY } from './domain/repositories/short-url.repository';

@Module({
  controllers: [ShortenController],
  providers: [
    // Application
    CreateShortUrlUseCase,
    GetShortUrlUseCase,
    UpdateShortUrlUseCase,
    DeleteShortUrlUseCase,
    GetShortUrlStatsUseCase,
    ShortCodeGeneratorService,
    // Infrastructure — bind interface token to concrete implementation
    {
      provide: SHORT_URL_REPOSITORY,
      useClass: DrizzleShortUrlRepository,
    },
  ],
})
export class ShortUrlModule {}
