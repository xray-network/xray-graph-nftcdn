import { eq, gt, sql, sum, and } from "drizzle-orm"
import { db, schema } from "../../db"
import { logger } from "../../utils"
import * as OgmiosTypes from "@cardano-ogmios/schema"
import * as Types from "../../types"

export const onRollBackward = async (point: OgmiosTypes.Point | OgmiosTypes.Origin) => {
  try {
    if (point !== "origin") {
      await db.transaction(async (tx) => {
        const assetsToRollback = await tx
          .select({
            fingerprint: schema.assetMint.fingerprint,
            policy_id: sql<string>`''`,
            asset_name: sql<string>`''`,
            quantity: sql<string>`SUM(${schema.assetMint.quantity})`,
          })
          .from(schema.assetMint)
          .groupBy(schema.assetMint.fingerprint)
          .where(gt(schema.assetMint.slot, point.slot))
        if (assetsToRollback.length) {
          await tx
            .insert(schema.asset)
            .values(assetsToRollback)
            .onConflictDoUpdate({
              target: [schema.asset.fingerprint],
              set: { quantity: sql`asset.quantity - excluded.quantity` },
            })
          await tx.delete(schema.assetMint).where(gt(schema.assetMint.slot, point.slot))
        }
        await tx.delete(schema.cip25_metadata).where(gt(schema.cip25_metadata.slot, point.slot))
        await tx.delete(schema.cip27_metadata).where(gt(schema.cip27_metadata.slot, point.slot))
        await tx.delete(schema.cip68_datum).where(gt(schema.cip68_datum.slot, point.slot))
        await tx
          .update(schema.checkpoint_slot)
          .set({
            slot: point.slot,
            id: point.id,
          })
          .where(eq(schema.checkpoint_slot.name, "resume_slot"))
      })
      logger(`Rollback :: ${JSON.stringify(point)}`)
    } else {
      logger(`Rollback :: To Origin`)
    }
  } catch (error) {
    logger(`Rollback :: Error :: ${JSON.stringify(error)}`)
  }
}
