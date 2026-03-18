import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ShortUrlRepository,
  FindByShortCodeOptions,
} from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { DrizzleShortUrlRepository } from './drizzle-short-url.repository';
import { RedisService } from '../../../../infra/redis/redis.service';
import type { RedisConfig } from '../../../../config/redis.config';

const CACHE_KEY_PREFIX = 'shorturl:';

type ShortUrlCachePayload = {
  id: string;
  url: string;
  shortCode: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Repository com cache-aside para findByShortCode.
 * Invalida cache em PUT (updateUrlByShortCode) e DELETE (deleteByShortCode).
 */
@Injectable()
export class CachedShortUrlRepository implements ShortUrlRepository {
  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly inner: DrizzleShortUrlRepository,
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    const redisConfig = configService.get<RedisConfig>('redis');
    this.cacheTtlSeconds = redisConfig?.cacheTtlSeconds ?? 60;
  }

  private cacheKey(shortCode: string): string {
    return `${CACHE_KEY_PREFIX}${shortCode}`;
  }

  private serialize(entity: ShortUrl): string {
    const payload: ShortUrlCachePayload = {
      id: entity.id,
      url: entity.url,
      shortCode: entity.shortCode,
      accessCount: entity.accessCount,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
    return JSON.stringify(payload);
  }

  private deserialize(raw: string): ShortUrl {
    const payload = JSON.parse(raw) as ShortUrlCachePayload;
    return new ShortUrl({
      id: payload.id,
      url: payload.url,
      shortCode: payload.shortCode,
      accessCount: payload.accessCount,
      createdAt: new Date(payload.createdAt),
      updatedAt: new Date(payload.updatedAt),
    });
  }

  private async invalidate(shortCode: string): Promise<void> {
    try {
      await this.redisService.getClient().del(this.cacheKey(shortCode));
    } catch {
      // Cache invalidation failure: next read will get stale or miss
    }
  }

  async create(shortUrl: ShortUrl): Promise<void> {
    return this.inner.create(shortUrl);
  }

  async findByShortCode(
    shortCode: string,
    options?: FindByShortCodeOptions,
  ): Promise<ShortUrl | null> {
    if (options?.skipCache) {
      return this.inner.findByShortCode(shortCode);
    }

    const key = this.cacheKey(shortCode);
    const redis = this.redisService.getClient();

    try {
      const cached = await redis.get(key);
      if (cached) {
        return this.deserialize(cached);
      }
    } catch {
      // Cache read failure: fallback to DB
    }

    const entity = await this.inner.findByShortCode(shortCode);
    if (!entity) return null;

    try {
      await redis.setex(key, this.cacheTtlSeconds, this.serialize(entity));
    } catch {
      // Cache write failure: no-op, next read will hit DB
    }

    return entity;
  }

  async incrementAccessCount(shortCode: string): Promise<void> {
    return this.inner.incrementAccessCount(shortCode);
  }

  async updateUrlByShortCode(input: {
    shortCode: string;
    url: string;
  }): Promise<ShortUrl | null> {
    const result = await this.inner.updateUrlByShortCode(input);
    await this.invalidate(input.shortCode);
    return result;
  }

  async deleteByShortCode(shortCode: string): Promise<boolean> {
    const result = await this.inner.deleteByShortCode(shortCode);
    await this.invalidate(shortCode);
    return result;
  }
}
