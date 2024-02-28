import express from "express"
import { sql, desc, asc, eq, ne } from "drizzle-orm"
import { db, schema } from "../../db"
import { logger } from "../../utils"
import * as Kubo from "../../services/kubo"

export const ipfs = express.Router()

ipfs.get("/*", async (req, res) => {
  try {
    const cid = (req.params as any)?.[0]
    const imageResponse = await Kubo.getImage(cid)

    imageResponse.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    await imageResponse.body
      ?.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk)
          },
        })
      )
      .then(() => res.end())
      .catch(() => res.destroy())
  } catch (error: any) {
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error").end()
  }
})
