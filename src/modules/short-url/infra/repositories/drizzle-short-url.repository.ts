import { Injectable } from '@nestjs/common';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { DatabaseService } from '../../../../infra/database/database.service';
import { shortUrls } from '../../../../infra/database/schema/short-urls.table';
import { eq, sql } from 'drizzle-orm';
import { ShortUrlPersistenceMapper } from '../mappers/short-url.persistence-mapper';
import { ShortCodeConflictError } from '../../domain/errors/short-code-conflict.error';

// PostgreSQL unique-violation error code
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === PG_UNIQUE_VIOLATION
  );
}

@Injectable()
export class DrizzleShortUrlRepository implements ShortUrlRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private get db() {
    return this.databaseService.db;
  }

  async create(shortUrl: ShortUrl): Promise<void> {
    const data = ShortUrlPersistenceMapper.toPersistence(shortUrl);
    try {
      await this.db.insert(shortUrls).values(data).execute();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ShortCodeConflictError(shortUrl.shortCode);
      }
      throw error;
    }
  }

  async findByShortCode(shortCode: string): Promise<ShortUrl | null> {
    const [record] = await this.db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .execute();

    if (!record) return null;

    return ShortUrlPersistenceMapper.toDomain(record);
  }

  async update(shortUrl: ShortUrl): Promise<void> {
    const data = ShortUrlPersistenceMapper.toPersistence(shortUrl);
    await this.db
      .update(shortUrls)
      .set({ url: data.url, updatedAt: data.updatedAt })
      .where(eq(shortUrls.shortCode, data.shortCode))
      .execute();
  }

  async delete(shortCode: string): Promise<void> {
    await this.db
      .delete(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .execute();
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
}
