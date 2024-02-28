CREATE TABLE IF NOT EXISTS "asset" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"policy_id" text NOT NULL,
	"asset_name" text,
	"ref_fingerprint" text,
	"quantity" numeric NOT NULL,
	CONSTRAINT "asset_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_mint" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" integer NOT NULL,
	"tx_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"quantity" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkpoint_slot" (
	"name" text NOT NULL,
	"slot" integer NOT NULL,
	"id" text NOT NULL,
	CONSTRAINT "checkpoint_slot_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cip25_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" integer NOT NULL,
	"fingerprint" text NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cip26_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"policy_id" text NOT NULL,
	"asset_name" text,
	"subject" text NOT NULL,
	"policy" text,
	"name" text,
	"description" text,
	"ticker" text,
	"url" text,
	"logo" text,
	"decimals" integer DEFAULT 0,
	CONSTRAINT "cip26_metadata_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cip27_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" integer NOT NULL,
	"fingerprint" text NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cip68_datum" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" integer NOT NULL,
	"fingerprint" text NOT NULL,
	"datum_hash" text NOT NULL,
	"datum" text NOT NULL,
	"is_inline" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asset_policy_id" ON "asset" ("policy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asset_asset_name" ON "asset" ("asset_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asset_mint_slot" ON "asset_mint" ("slot");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asset_mint_fingerprint" ON "asset_mint" ("fingerprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cip25_slot" ON "cip25_metadata" ("slot");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cip25_fingerprint" ON "cip25_metadata" ("fingerprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cip27_slot" ON "cip27_metadata" ("slot");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cip27_fingerprint" ON "cip27_metadata" ("fingerprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cip68_slot" ON "cip68_datum" ("slot");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cip68_fingerprint" ON "cip68_datum" ("fingerprint");