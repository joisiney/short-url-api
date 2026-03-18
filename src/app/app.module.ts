import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '../config/config.module';
import { ShortUrlModule } from '../modules/short-url/short-url.module';
import { DatabaseModule } from '../infra/database/database.module';
import { HealthModule } from '../shared/health/health.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ShortUrlModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
