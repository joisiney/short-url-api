import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigModule } from '@config/config.module';
import { ShortUrlModule } from '@modules/short-url/short-url.module';
import { DatabaseModule } from '@infra/database/database.module';
import { RedisModule } from '@infra/redis/redis.module';
import { RedisService } from '@infra/redis/redis.service';
import { HealthModule } from '@shared/health/health.module';
import { SecurityInputGuard } from '@shared/http/guards/security-input.guard';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    ShortUrlModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        storage: new ThrottlerStorageRedisService(redisService.getClient()),
        skipIf: () => process.env.NODE_ENV === 'test',
      }),
    }),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SecurityInputGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
