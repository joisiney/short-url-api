DROP TABLE IF EXISTS "short_urls";--> statement-breakpoint
CREATE TABLE "short_urls" (
	"id" bigint NOT NULL,
	"url" text NOT NULL,
	"short_code" varchar(32) NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_short_urls" PRIMARY KEY("id"),
	CONSTRAINT "uq_short_urls_short_code" UNIQUE("short_code"),
	CONSTRAINT "ck_short_urls_access_count_non_negative" CHECK ("short_urls"."access_count" >= 0)
);
