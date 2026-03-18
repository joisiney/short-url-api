import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { RedisConfig } from '../../config/redis.config';

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
      maxRetriesPerRequest: 3,
      retryStrategy: (times) =>
        times > 3 ? null : Math.min(times * 100, 3000),
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
