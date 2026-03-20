import { Injectable } from '@nestjs/common';
import type {
  ShortUrlRepository,
  FindByShortCodeOptions,
} from '@modules/short-url/domain/repositories/short-url.repository';
import { ShortUrl } from '@modules/short-url/domain/entities/short-url.entity';
import { DatabaseService } from '@infra/database/database.service';
import { shortUrls } from '@infra/database/schema/short-urls.table';
import { eq, sql } from 'drizzle-orm';
import { ShortUrlPersistenceMapper } from '@modules/short-url/infra/mappers/short-url.persistence-mapper';

@Injectable()
export class DrizzleShortUrlRepository implements ShortUrlRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private get db() {
    return this.databaseService.db;
  }

  async create(shortUrl: ShortUrl): Promise<void> {
    const data = ShortUrlPersistenceMapper.toPersistence(shortUrl);
    await this.db.insert(shortUrls).values(data).execute();
  }

  async findByUrl(url: string): Promise<ShortUrl | null> {
    const [record] = await this.db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.url, url))
      .execute();

    if (!record) return null;

    return ShortUrlPersistenceMapper.toDomain(record);
  }

  async findByShortCode(
    shortCode: string,
    _options?: FindByShortCodeOptions,
  ): Promise<ShortUrl | null> {
    const [record] = await this.db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .execute();

    if (!record) return null;

    return ShortUrlPersistenceMapper.toDomain(record);
  }

  async incrementAccessCount(shortCode: string): Promise<void> {
    await this.db
      .update(shortUrls)
      .set({
        accessCount: sql`${shortUrls.accessCount} + 1`,
      })
      .where(eq(shortUrls.shortCode, shortCode))
      .execute();
  }

  async updateUrlByShortCode(input: {
    shortCode: string;
    url: string;
  }): Promise<ShortUrl | null> {
    const [updatedRecord] = await this.db
      .update(shortUrls)
      .set({
        url: input.url,
        updatedAt: new Date(),
      })
      .where(eq(shortUrls.shortCode, input.shortCode))
      .returning()
      .execute();

    if (!updatedRecord) return null;

    return ShortUrlPersistenceMapper.toDomain(updatedRecord);
  }

  async deleteByShortCode(shortCode: string): Promise<boolean> {
    const [deletedRecord] = await this.db
      .delete(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .returning({ id: shortUrls.id })
      .execute();

    return !!deletedRecord;
  }
}
