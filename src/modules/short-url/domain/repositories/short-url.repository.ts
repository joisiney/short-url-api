import { ShortUrl } from '../entities/short-url.entity';

export const SHORT_URL_REPOSITORY = Symbol('SHORT_URL_REPOSITORY');

export interface ShortUrlRepository {
  create(shortUrl: ShortUrl): Promise<void>;
  findByShortCode(shortCode: string): Promise<ShortUrl | null>;
  update(shortUrl: ShortUrl): Promise<void>;
  delete(shortCode: string): Promise<void>;
  incrementAccessCount(shortCode: string): Promise<void>;
}
