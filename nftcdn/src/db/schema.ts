import { pgTable, serial, text, integer, index, numeric } from "drizzle-orm/pg-core"

export const asset = pgTable(
  "asset",
  {
    id: serial("id").primaryKey(),
    fingerprint: text("fingerprint").notNull().unique(),
    policy_id: text("policy_id").notNull(),
    asset_name: text("asset_name"),
    ref_fingerprint: text("ref_fingerprint"),
    quantity: numeric("quantity").notNull(),
  },
  (table) => ({
    idx_asset_policy_id: index("idx_asset_policy_id").on(table.policy_id),
    idx_asset_asset_name: index("idx_asset_asset_name").on(table.asset_name),
  })
)

export const assetMint = pgTable(
  "asset_mint",
  {
    id: serial("id").primaryKey(),
    slot: integer("slot").notNull(),
    tx_id: text("tx_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    quantity: numeric("quantity").notNull(),
  },
  (table) => ({
    idx_asset_mint_slot: index("idx_asset_mint_slot").on(table.slot),
    idx_asset_mint_fingerprint: index("idx_asset_mint_fingerprint").on(table.fingerprint),
  })
)

// Tx Metadata -> 721
export const cip25_metadata = pgTable(
  "cip25_metadata",
  {
    id: serial("id").primaryKey(),
    slot: integer("slot").notNull(),
    fingerprint: text("fingerprint").notNull(),
    metadata: text("metadata"),
  },
  (table) => ({
    idx_cip25_slot: index("idx_cip25_slot").on(table.slot),
    idx_cip25_fingerprint: index("idx_cip25_fingerprint").on(table.fingerprint),
  })
)

// Cardano Token Registry Metadata
export const cip26_metadata = pgTable("cip26_metadata", {
  id: serial("id").primaryKey(),
  fingerprint: text("fingerprint").notNull().unique(),
  policy_id: text("policy_id").notNull(),
  asset_name: text("asset_name"),
  subject: text("subject").notNull(),
  policy: text("policy"),
  name: text("name"),
  description: text("description"),
  ticker: text("ticker"),
  url: text("url"),
  logo: text("logo"),
  decimals: integer("decimals").default(0),
})

// Tx Metadata -> 777
export const cip27_metadata = pgTable(
  "cip27_metadata",
  {
    id: serial("id").primaryKey(),
    slot: integer("slot").notNull(),
    fingerprint: text("fingerprint").notNull(),
    metadata: text("metadata"),
  },
  (table) => ({
    idx_cip27_slot: index("idx_cip27_slot").on(table.slot),
    idx_cip27_fingerprint: index("idx_cip27_fingerprint").on(table.fingerprint),
  })
)

// Datums Metadata
export const cip68_datum = pgTable(
  "cip68_datum",
  {
    id: serial("id").primaryKey(),
    slot: integer("slot").notNull(),
    fingerprint: text("fingerprint").notNull(),
    datum_hash: text("datum_hash").notNull(),
    datum: text("datum").notNull(),
    is_inline: integer("is_inline").notNull(), // 0 or 1
  },
  (table) => ({
    idx_cip68_slot: index("idx_cip68_slot").on(table.slot),
    idx_cip68_fingerprint: index("idx_cip68_fingerprint").on(table.fingerprint),
  })
)

export const checkpoint_slot = pgTable("checkpoint_slot", {
  name: text("name").notNull().unique(),
  slot: integer("slot").notNull(),
  id: text("id").notNull(),
})
