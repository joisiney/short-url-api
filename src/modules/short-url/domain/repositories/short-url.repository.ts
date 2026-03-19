import { ShortUrl } from '../entities/short-url.entity';

export const SHORT_URL_REPOSITORY = Symbol('SHORT_URL_REPOSITORY');

export interface FindByShortCodeOptions {
  skipCache?: boolean;
}

export interface ShortUrlRepository {
  create(shortUrl: ShortUrl): Promise<void>;
  findByUrl(url: string): Promise<ShortUrl | null>;
  findByShortCode(
    shortCode: string,
    options?: FindByShortCodeOptions,
  ): Promise<ShortUrl | null>;
  incrementAccessCount(shortCode: string): Promise<void>;

  updateUrlByShortCode(input: {
    shortCode: string;
    url: string;
  }): Promise<ShortUrl | null>;
  deleteByShortCode(shortCode: string): Promise<boolean>;
}
