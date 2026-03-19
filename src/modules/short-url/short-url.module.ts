import { Module } from '@nestjs/common';

import { ShortenController } from './http/controllers/shorten.controller';

import { CreateShortUrlUseCase } from './application/use-cases/create-short-url.use-case';
import { GetShortUrlUseCase } from './application/use-cases/get-short-url.use-case';
import { UpdateShortUrlUseCase } from './application/use-cases/update-short-url.use-case';
import { DeleteShortUrlUseCase } from './application/use-cases/delete-short-url.use-case';
import { GetShortUrlStatsUseCase } from './application/use-cases/get-short-url-stats.use-case';
import { IdGeneratorService } from './application/services/id-generator.service';
import { Base62EncoderService } from './application/services/base62-encoder.service';

import { DrizzleShortUrlRepository } from './infra/repositories/drizzle-short-url.repository';
import { CachedShortUrlRepository } from './infra/repositories/cached-short-url.repository';
import { SHORT_URL_REPOSITORY } from './domain/repositories/short-url.repository';
import { RedisModule } from '../../infra/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [ShortenController],
  providers: [
    // Application
    CreateShortUrlUseCase,
    GetShortUrlUseCase,
    UpdateShortUrlUseCase,
    DeleteShortUrlUseCase,
    GetShortUrlStatsUseCase,
    IdGeneratorService,
    Base62EncoderService,
    // Infrastructure
    DrizzleShortUrlRepository,
    {
      provide: SHORT_URL_REPOSITORY,
      useClass: CachedShortUrlRepository,
    },
  ],
})
export class ShortUrlModule {}
