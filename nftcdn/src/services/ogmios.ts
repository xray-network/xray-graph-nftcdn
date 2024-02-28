import { createInteractionContext, createChainSynchronizationClient } from "@cardano-ogmios/client"
import * as OgmiosTypes from "@cardano-ogmios/schema"
import { logger } from "../utils"

import { OGMIOS_HOST, OGMIOS_PORT } from "../config/vars"

const ogmiosProtocolAndHost = OGMIOS_HOST?.startsWith("http") ? OGMIOS_HOST?.split("://") : [undefined, OGMIOS_HOST]
const ogmiosTls = ogmiosProtocolAndHost?.[0] === "https"
const ogmiosHost = ogmiosProtocolAndHost?.[1]
const ogmiosPort = OGMIOS_PORT

let context
let syncClient

export const runSync = async (
  rollForward: (block: OgmiosTypes.BlockPraos) => Promise<void>,
  rollBackward: (point: OgmiosTypes.Point | OgmiosTypes.Origin) => Promise<void>,
  resume?: {
    slot: number
    id: string
  }
) => {
  const createContext = () => {
    return createInteractionContext(
      (err) => logger(JSON.stringify(err)),
      () => {
        logger("Ogmios :: Connection closed")
        restart()
      },
      { connection: { host: ogmiosHost, port: ogmiosPort, tls: ogmiosTls } }
    )
  }
  const restart = () => {
    logger(`Restarting in 10 seconds...`)
    setTimeout(() => {
      runSync(rollForward, rollBackward, resume)
    }, 10_000)
  }
  try {
    context = await createContext()
    syncClient = await createChainSynchronizationClient(context, {
      rollForward: async ({ block }, requestNextBlock) => {
        await rollForward(block as OgmiosTypes.BlockPraos) // as BlockPraos, since we're starting from Mary Era
        requestNextBlock()
      },
      rollBackward: async ({ point }, requestNextBlock) => {
        await rollBackward(point)
        requestNextBlock()
      },
    })
    await syncClient.resume(resume && [resume])
  } catch (error: any) {
    logger(`Ogmios Error :: ${error.message} :: ${JSON.stringify(error)}`)
    restart()
  }
}
