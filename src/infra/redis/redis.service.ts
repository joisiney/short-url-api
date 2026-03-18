import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { RedisConfig } from '../../config/redis.config';

/**
 * Redis usado para cache (CachedShortUrlRepository) e seguranca (Throttler rate limit distribuido).
 * ADR-00-14.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
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
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client nao inicializado');
    }
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client?.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
