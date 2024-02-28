import express from "express"
import { logger } from "./utils"
import { assets, image, ipfs, metadata } from "./app/server"

export const app = express()

app.use(express.json())
app.use("/assets", assets)
app.use("/image", image)
app.use("/metadata", metadata)
app.use("/ipfs", ipfs)

app.listen(4700, async () => {
  logger("Image Server :: Running :: http://127.0.0.1:4700")
})
