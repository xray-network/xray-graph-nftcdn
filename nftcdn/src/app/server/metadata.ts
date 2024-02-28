import express from "express"
import { logger } from "../../utils"
import * as Utils from "../../utils"
import { SERVER_IMAGE_URL } from "../../config/vars"
import { getAssetsMetadata } from "./"

export const metadata = express.Router()

metadata.get("/:fingerprint", async (req, res) => {
  try {
    const fingerprint = req.params.fingerprint
    const { raw } = req.query
    const isRaw = raw === "true"
    const response = await processQuery([fingerprint], isRaw)
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
    const { fingerprints, raw } = req.body
    const isRaw = raw === true
    const response = await processQuery(fingerprints, isRaw)
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

const processQuery = async (fingerprints: string[], isRaw: boolean) => {
  const assets = await getAssetsMetadata(fingerprints)
  const response = assets.map((asset) => {
    const asset_name = Utils.decodeAssetName(asset?.asset_name || "")
    const cip25_metadata = asset?.cip25 ? Utils.JSONBigStringifiedBigInt(asset?.cip25) : null
    const cip26_metadata = asset?.cip26.fingerprint ? asset?.cip26 : null
    const cip27_metadata = asset?.cip27 ? Utils.JSONBigStringifiedBigInt(asset?.cip27) : null
    const cip68_datum = asset?.cip68 ? Utils.JSONBigStringifiedBigInt(asset?.cip68) : null

    const transformMetadata = (metadata: any, fields: string[], select: string) => {
      const updatedFields = fields.reduce((acc, field) => {
        const rawField = metadata?.[field]
        if (rawField) {
          const finalField = Array.isArray(rawField) ? rawField.join("") : rawField
          if (
            typeof finalField === "string" &&
            !finalField?.startsWith("http://") &&
            !finalField?.startsWith("https://")
          ) {
            acc[field] = `${SERVER_IMAGE_URL}/image/${asset.fingerprint}`
          }
        }
        return acc
      }, {} as any)
      return [
        metadata
          ? {
              ...metadata,
              ...Object.entries(updatedFields).reduce((acc, [key, value]) => {
                acc[key] = `${value}?select=${select}`
                return acc
              }, {} as any),
            }
          : null,
        metadata
          ? {
              ...metadata,
              ...updatedFields,
            }
          : null,
      ]
    }

    const [cip25_metadata_transformed, cip25_images] = transformMetadata(cip25_metadata, ["image"], "cip25")
    const [cip26_metadata_transformed, cip26_images] = transformMetadata(cip26_metadata, ["logo"], "cip26")
    const [cip68_datum_transformed, cip68_images] = transformMetadata(cip68_datum, ["image", "logo"], "cip68")

    const decimals = (() => {
      try {
        if (asset_name?.labelAscii === 333 || asset_name?.labelAscii === 444) {
          return Number(cip68_datum?.decimals) || Number(cip26_metadata?.decimals) || 0
        } else {
          return Number(cip26_metadata?.decimals) || 0
        }
      } catch {
        return 0
      }
    })()

    const image = cip68_images?.image || cip68_images?.logo || cip25_images?.image || cip26_images?.logo || null

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
      decimals: decimals,
      quantity: asset?.quantity,
      image: image,
      metadata: {
        cip25: isRaw ? cip25_metadata : cip25_metadata_transformed,
        cip26: isRaw ? cip26_metadata : cip26_metadata_transformed,
        cip27: cip27_metadata,
        cip68: isRaw ? cip68_datum : cip68_datum_transformed,
      },
    }
  })

  return response
}
