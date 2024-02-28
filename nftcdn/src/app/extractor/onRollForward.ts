import { eq, sql } from "drizzle-orm"
import { db, schema } from "../../db"
import { logger } from "../../utils"
import * as OgmiosTypes from "@cardano-ogmios/schema"
import { parseBlock } from "./parseBlock"

export const onRollForward = async (block: OgmiosTypes.BlockPraos) => {
  try {
    const a0 = performance.now()
    const { assets, assetMintsArray, cip25MetadataArray, cip27MetadataArray, cip68DatumArray } = parseBlock(block)
    const a1 = performance.now()
    await db.transaction(async (tx) => {
      if (assets.length) {
        await tx
          .insert(schema.asset)
          .values(assets)
          .onConflictDoUpdate({
            target: [schema.asset.fingerprint],
            set: { quantity: sql`asset.quantity + excluded.quantity` },
          })
      }
      if (assetMintsArray.length) await tx.insert(schema.assetMint).values(assetMintsArray)
      if (cip25MetadataArray.length) await tx.insert(schema.cip25_metadata).values(cip25MetadataArray)
      if (cip27MetadataArray.length) await tx.insert(schema.cip27_metadata).values(cip27MetadataArray)
      if (cip68DatumArray.length) await tx.insert(schema.cip68_datum).values(cip68DatumArray)
      await tx
        .update(schema.checkpoint_slot)
        .set({
          slot: block.slot,
          id: block.id,
        })
        .where(eq(schema.checkpoint_slot.name, "resume_slot"))
    })
    const a2 = performance.now()
    logger(
      `Block ${block.height} :: Slot ${block.slot} :: ` +
        `Total ${(a2 - a0).toFixed(3)}ms, Parse ${(a1 - a0).toFixed(3)}ms, Insert ${(a2 - a1).toFixed(3)}ms :: ` +
        `${JSON.stringify({
          assetMints: assetMintsArray.length,
          cip25Metadata: cip25MetadataArray.length,
          cip27Metadata: cip27MetadataArray.length,
          cip68Datums: cip68DatumArray.length,
        })}`
    )
  } catch (error) {
    console.error(error)
    logger(`Error :: Block ${block.height} :: Slot ${block.slot}`)
  }
}
