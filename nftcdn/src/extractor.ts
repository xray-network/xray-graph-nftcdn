import express from "express"
import cron from "node-cron"
import { dbMigrate } from "./scripts/migrateFn"
import { logger } from "./utils"
import * as Ogmios from "./services/ogmios"
import { getResumeSlot, onRollBackward, onRollForward, registrySync } from "./app/extractor"

export const app = express()

app.listen(4500, async () => {
  logger("Metadata Extractor :: Running :: http://127.0.0.1:4500")

  logger("Run DB migrations if needed...")
  await dbMigrate()

  logger(`Running Token Registry daemon...`)
  cron.schedule("*/10 * * * *", async () => {
    await registrySync()
  })

  logger(`Running Block parser...`)
  const resumeSlot = await getResumeSlot()
  logger(`Initial resume slot :: ${JSON.stringify(resumeSlot)}`)
  Ogmios.runSync(onRollForward, onRollBackward, resumeSlot)
})
