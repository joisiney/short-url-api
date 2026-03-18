import { Injectable } from '@nestjs/common';
import type {
  ShortUrlRepository,
  FindByShortCodeOptions,
} from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { DatabaseService } from '../../../../infra/database/database.service';
import { shortUrls } from '../../../../infra/database/schema/short-urls.table';
import { eq, sql } from 'drizzle-orm';
import { ShortUrlPersistenceMapper } from '../mappers/short-url.persistence-mapper';
import { ShortCodeConflictError } from '../../domain/errors/short-code-conflict.error';

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as Record<string, unknown>;
  if (e.code === PG_UNIQUE_VIOLATION) return true;
  const cause = e.cause;
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    (cause as Record<string, unknown>).code === PG_UNIQUE_VIOLATION
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
