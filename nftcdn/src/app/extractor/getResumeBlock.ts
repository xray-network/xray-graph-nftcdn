import { eq } from "drizzle-orm"
import { db, schema } from "../../db"
import { latestShelleySlotByNetwork } from "../../config/blocks"
import { NETWORK } from "../../config/vars"

export const getResumeSlot = async () => {
  const resumeSlot = (
    await db.select().from(schema.checkpoint_slot).where(eq(schema.checkpoint_slot.name, "resume_slot"))
  )[0]
  if (resumeSlot) {
    return resumeSlot
  } else {
    await db
      .insert(schema.checkpoint_slot)
      .values({
        name: "resume_slot",
        ...latestShelleySlotByNetwork[NETWORK],
      })
      .onConflictDoNothing()
    return latestShelleySlotByNetwork[NETWORK]
  }
}
