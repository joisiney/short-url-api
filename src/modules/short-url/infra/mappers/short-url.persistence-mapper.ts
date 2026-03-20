import { ShortUrl } from '@modules/short-url/domain/entities/short-url.entity';
import { shortUrls } from '@infra/database/schema/short-urls.table';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type ShortUrlRecord = InferSelectModel<typeof shortUrls>;
type ShortUrlInsert = InferInsertModel<typeof shortUrls>;

export class ShortUrlPersistenceMapper {
  static toDomain(raw: ShortUrlRecord): ShortUrl {
    return new ShortUrl({
      id: String(raw.id),
      url: raw.url,
      shortCode: raw.shortCode,
      accessCount: raw.accessCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(shortUrl: ShortUrl): ShortUrlInsert {
    return {
      id: Number(shortUrl.id),
      url: shortUrl.url,
      shortCode: shortUrl.shortCode,
      accessCount: shortUrl.accessCount,
      createdAt: shortUrl.createdAt,
      updatedAt: shortUrl.updatedAt,
    };
  }
}
