import express from "express"
import { logger } from "../utils"
import { getAssetsMetadata } from "../services/koios"

const metadata = express.Router()
export default metadata

metadata.get("/:id", async (req, res) => {
  try {
    const assetIdRaw = req.params.id
    const assetId = [req.params.id.slice(0, 56), req.params.id.slice(56)]

    const response = (await getAssetsMetadata([assetId])).data || []
    if (!response.length) {
      res.status(404).send(`Metadata Not Found`)
      return
    }
    res.send(response[0])
  } catch (error: any) {
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error")
  }
})

metadata.post("/", async (req, res) => {
  try {
    const { _asset_list } = req.body
    
    const response = (await getAssetsMetadata(_asset_list)).data || []
    if (!response.length) {
      res.status(404).send(`Metadata Not Found`)
      return
    }
    res.send(response)
  } catch (error: any) {
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error")
  }
})
