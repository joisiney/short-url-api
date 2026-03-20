import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { RedisConfig } from '@config/redis.config';

const REDIS_RETRY_MAX_ATTEMPTS = 3;
const REDIS_RETRY_BASE_MS = 100;
const REDIS_RETRY_MAX_DELAY_MS = 3000;

/**
 * Redis usado para cache (CachedShortUrlRepository) e seguranca (Throttler rate limit distribuido).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<RedisConfig>('redis');
    if (!config) {
      throw new Error('Redis config nao carregada');
    }

    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      connectTimeout: config.connectTimeoutMs,
      enableReadyCheck: true,
      maxRetriesPerRequest: REDIS_RETRY_MAX_ATTEMPTS,
      retryStrategy: (times) =>
        times > REDIS_RETRY_MAX_ATTEMPTS
          ? null
          : Math.min(times * REDIS_RETRY_BASE_MS, REDIS_RETRY_MAX_DELAY_MS),
      ...(config.tlsEnabled && { tls: {} }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
