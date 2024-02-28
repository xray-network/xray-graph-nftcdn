import { sql, desc, asc, eq, ne, and, like, or } from "drizzle-orm"
import { db, schema } from "../../../db"

export const getAssets = async ({
  policy_id,
  fingerprint,
  asset_name,
  asset_name_ascii,
  limit,
  offset,
}: {
  policy_id?: string
  fingerprint?: string
  asset_name?: string
  asset_name_ascii?: string
  limit?: number
  offset?: number
}) => {
  const assets = await db
    .select()
    .from(schema.asset)
    .where(
      or(
        fingerprint ? eq(schema.asset.fingerprint, fingerprint) : undefined,
        policy_id ? eq(schema.asset.policy_id, policy_id) : undefined,
        asset_name ? eq(schema.asset.asset_name, asset_name) : undefined,
        asset_name_ascii
          ? like(schema.asset.asset_name, `%${Buffer.from(asset_name_ascii || "").toString("hex")}%`)
          : undefined
      )
    )
    .orderBy(desc(schema.asset.id))
    .limit(limit || 100)
    .offset(offset || 0)

  return assets
}
