import express from "express"
import { logger } from "./utils"
import image from "./app/image"
import metadata from "./app/metadata"
import ipfs from "./app/ipfs"

export const app = express()

app.use(express.json())
app.use("/image", image)
app.use("/metadata", metadata)
app.use("/ipfs", ipfs)

app.listen(4700, async () => {
  logger("Image Server :: Running :: http://127.0.0.1:4700")
})
