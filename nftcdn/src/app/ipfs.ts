import express from "express"
import { logger } from "../utils"
import * as Kubo from "../services/kubo"

const ipfs = express.Router()
export default ipfs

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
    console.log(error)
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error").end()
  }
})
