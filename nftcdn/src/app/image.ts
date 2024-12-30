import express from "express"
import fs from "fs"
import sharp from "sharp"
import { logger } from "../utils"
import * as Utils from "../utils"
import * as Types from "../types"
import { getImage } from "../services/kubo"
import { getAssetsMetadata } from "../services/koios"
import { IMAGE_SIZES, IMAGE_FORMATS } from "../config"

const image = express.Router()
export default image

const CIP25_CACHE_FOLDER = "./cache/cip25"
const CIP26_CACHE_FOLDER = "./cache/cip26"
const CIP68_CACHE_FOLDER = "./cache/cip68"
!fs.existsSync(CIP25_CACHE_FOLDER) && fs.mkdirSync(CIP25_CACHE_FOLDER, { recursive: true })
!fs.existsSync(CIP26_CACHE_FOLDER) && fs.mkdirSync(CIP26_CACHE_FOLDER, { recursive: true })
!fs.existsSync(CIP68_CACHE_FOLDER) && fs.mkdirSync(CIP68_CACHE_FOLDER, { recursive: true })

image.get("/:id", async (req, res) => {
  try {
    const assetId = [req.params.id.split(".")[0], req.params.id.split(".")[1]]
    const assetIdRaw = assetId.join(".")

    console.log(IMAGE_SIZES)

    const crop = req.query.crop === "true"
    const prefer = req.query.prefer as "cip25" | "cip26" | "cip68" | undefined
    const size = isNaN(Number(req.query.size)) ? "original" : Number(req.query.size)
    const webpSupported = req.headers.accept?.includes("image/webp")

    if (size !== "original" && !IMAGE_SIZES.includes(size)) {
      res.status(400).send(`Invalid Request :: Select correct size :: ${IMAGE_SIZES.join(", ")}`)
      return
    }

    const assetMetadata = (await getAssetsMetadata([assetId]))?.data?.[0]
    if (!assetMetadata) {
      res.status(404).send(`Image Not Found :: ${assetIdRaw}`)
      return
    }

    const policy_id = assetMetadata?.policy_id!
    const asset_name_ascii = assetMetadata?.asset_name_ascii!

    const cip25_metadata = assetMetadata.minting_tx_metadata?.[721]?.[policy_id]?.[asset_name_ascii]
    const cip26_metadata = assetMetadata.token_registry_metadata
    const cip68_metadata_raw =
      assetMetadata.cip68_metadata?.[222] ||
      assetMetadata.cip68_metadata?.[333] ||
      assetMetadata.cip68_metadata?.[444] ||
      assetMetadata.cip68_metadata?.[100]
    const cip68_metadata = cip68_metadata_raw ? Utils.parsePlutusJsonData(cip68_metadata_raw)?.[0] : undefined

    const cip25_images = Utils.joinMetadata(cip25_metadata, ["image"])
    const cip26_images = Utils.joinMetadata(cip26_metadata, ["logo"])
    const cip68_images = Utils.joinMetadata(cip68_metadata, ["image", "logo"])

    const imageData = (() => {
      const imageSources = {
        cip68: cip68_images.image || cip68_images.logo,
        cip25: cip25_images.image,
        cip26: cip26_images.logo,
      }

      if (prefer && imageSources[prefer]) {
        return {
          type: prefer,
          value: imageSources[prefer],
        }
      }

      for (const [type, value] of Object.entries(imageSources)) {
        if (value) {
          return { type, value }
        }
      }

      return null
    })()

    if (imageData?.value) {
      const sha224hash = Utils.getSha224(imageData.value)
      const imagePath = `./cache/${imageData.type}/${sha224hash}_${size}${crop && size !== "original" ? "_crop" : ""}`

      const cachedFiles = IMAGE_FORMATS.reduce((acc, format) => {
        if (fs.existsSync(`${imagePath}.${format}`)) {
          acc.push(format)
          return acc
        }
        return acc
      }, [] as Types.MediaTypes[])

      if (cachedFiles.length) {
        const hasWebpFormat = cachedFiles.includes("webp")
        if (hasWebpFormat && webpSupported) {
          res.setHeader("content-type", "image/webp")
          res.setHeader("cache-control", "public, max-age=31536000, immutable")
          res.send(fs.readFileSync(`${imagePath}.webp`))
          return
        }
        const format = cachedFiles.filter((format) => format !== "webp")[0]
        if (format) {
          res.setHeader("content-type", `image/${format}`)
          res.setHeader("cache-control", "public, max-age=31536000, immutable")
          res.send(fs.readFileSync(`${imagePath}.${format}`))
          return
        }
      }

      // Remote Image Processing
      const processRemote = async (imageResponse: Response, cache: boolean) => {
        const contentType = (imageResponse.headers.get("content-type") || "")?.split("/")
        const typeRaw = contentType[0] as any
        const formatRaw = contentType[1] as Types.MediaTypes
        if (typeRaw === "image" && IMAGE_FORMATS.includes(formatRaw)) {
          if (size === "original" || formatRaw === "svg") {
            imageResponse.headers.forEach((value, key) => {
              res.setHeader(key, value)
            })
            res.setHeader("content-type", `image/${formatRaw}`)
            res.setHeader("cache-control", "public, max-age=31536000, immutable")
            const stream = new WritableStream({
              write(chunk) {
                res.write(chunk)
              },
            })
            await imageResponse.body?.pipeTo(stream)
            res.end()
            return
          } else {
            const format = webpSupported ? "webp" : formatRaw
            const sharpImage = sharp(await imageResponse.arrayBuffer(), {
              animated: true,
              limitInputPixels: 268402689 * 5,
            })
            const sharpResized = crop ? sharpImage.resize(size, size, { fit: "cover" }) : sharpImage.resize(size)
            cache && (await sharpResized.toFormat(format).toFile(`${imagePath}.${format}`))
            imageResponse.headers.forEach((value, key) => {
              res.setHeader(key, value)
            })
            format === "webp" && res.setHeader("content-type", "image/webp")
            res.setHeader("cache-control", "public, max-age=31536000, immutable")
            res.send(await sharpResized.toBuffer())
          }
        }
      }

      const imageProvider = Utils.getImageProvider(imageData?.value)

      // IPFS Image Processing
      if (imageProvider?.type === "ipfs" && imageProvider.value) {
        try {
          const imageResponse = await getImage(imageProvider.value)
          if (imageResponse.ok) {
            await processRemote(imageResponse, true)
            return
          }
        } catch (error) {
          logger(JSON.stringify(error))
          res.status(500).send("Image Server :: Error :: IPFS Image Processing Error")
          return
        }
      }

      // HTTP Image Processing
      if (imageProvider?.type === "http" && imageProvider.value) {
        try {
          if (size === "original") {
            res.redirect(301, imageData.value) // 301 redirect if original size
            return
          } else {
            const imageResponse = await fetch(imageProvider.value)
            if (imageResponse.ok) {
              await processRemote(imageResponse, false) // There is no cache as the image is retrieved from the mutable source
              return
            }
          }
        } catch (error) {
          logger(JSON.stringify(error))
          res.status(500).send("Image Server :: Error :: HTTP Image Processing Error")
          return
        }
      }

      // Base64 Image Processing
      if (imageProvider?.type === "base64" && imageProvider.value) {
        try {
          const sharpImage = sharp(Buffer.from(imageProvider.value, "base64"), {
            animated: true,
            limitInputPixels: 268402689 * 5,
          })
          const format = webpSupported ? "webp" : ""
          const sharpResized =
            size === "original"
              ? sharpImage
              : crop
                ? sharpImage.resize(size, size, { fit: "cover" })
                : sharpImage.resize(size)
          const sharpFormatted = format ? sharpResized.toFormat(format) : sharpResized
          res.setHeader("content-type", `image${format ? `/${format}` : ""}`)
          res.setHeader("cache-control", "public, max-age=31536000, immutable")
          res.send(await sharpFormatted.toBuffer())
          return
        } catch (error) {
          logger(JSON.stringify(error))
          res.status(500).send("Image Server :: Error :: Base64 Image Processing Error")
          return
        }
      }
    }

    res.status(404).send(`Image Server :: Error :: Image Not Found :: ${assetIdRaw}`)
  } catch (error: any) {
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error")
  }
})
