import express, { raw } from "express"
import { logger } from "../../utils"
import * as Utils from "../../utils"
import { getAssets } from "./"

export const assets = express.Router()

assets.get("/", async (req, res) => {
  try {
    const { policy_id, fingerprint, asset_name, asset_name_ascii, limit, offset } = req.query

    const limit_number = Math.abs(Number(limit))
    const limit_set = limit ? (isNaN(limit_number) ? 100 : limit_number > 1000 ? 1000 : limit_number) : 0

    const offset_number = Math.abs(Number(offset))
    const offset_set = offset ? (isNaN(offset_number) ? 100 : offset_number) : 0

    const assets = await getAssets({
      policy_id: policy_id ? (policy_id as string) : undefined,
      fingerprint: fingerprint ? (fingerprint as string) : undefined,
      asset_name: asset_name ? (asset_name as string) : undefined,
      asset_name_ascii: asset_name_ascii ? (asset_name_ascii as string) : undefined,
      limit: limit_set,
      offset: offset_set,
    })

    if (!assets.length) {
      res.status(404).send(`Assets Not Found`)
      return
    }

    const response = assets.map((asset) => {
      const asset_name = Utils.decodeAssetName(asset?.asset_name || "")
      return {
        fingerprint: asset?.fingerprint,
        ref_fingerprint: asset?.ref_fingerprint || null,
        policy_id: asset?.policy_id,
        asset_name: asset?.asset_name || "",
        asset_name_ascii: asset_name?.assetNameAscii || "",
        asset_name_formatted: asset_name?.assetNameFormatted || "",
        asset_name_full: asset_name?.assetNameFull || "",
        asset_name_label: asset_name?.labelAscii || null,
        asset_name_label_type: asset_name?.labelType || null,
      }
    })

    res.setHeader("Content-Range", `${offset_set}-${offset_set + response.length}/*`)
    res.send(response)
  } catch (error: any) {
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error")
  }
})
