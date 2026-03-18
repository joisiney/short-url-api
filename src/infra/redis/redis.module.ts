import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Modulo Redis: cache e seguranca (rate limit distribuido).
 * ADR-00-14.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
