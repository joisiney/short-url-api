import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  timestamp,
  unique,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const shortUrls = pgTable(
  'short_urls',
  {
    id: bigint('id', { mode: 'number' }).notNull(),
    url: text('url').notNull(),
    shortCode: varchar('short_code', { length: 32 }).notNull(),
    accessCount: integer('access_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ name: 'pk_short_urls', columns: [table.id] }),
    unique('uq_short_urls_short_code').on(table.shortCode),
    unique('uq_short_urls_url').on(table.url),
    check(
      'ck_short_urls_access_count_non_negative',
      sql`${table.accessCount} >= 0`,
    ),
  ],
);
