import express from "express"
import fs from "fs"
import sharp from "sharp"
import { sql, desc, asc, eq, ne, like } from "drizzle-orm"
import { db, schema } from "../../db"
import { logger } from "../../utils"
import * as Utils from "../../utils"
import * as Types from "../../types"
import * as Kubo from "../../services/kubo"
import { MAX_IMAGE_SIZE } from "../../config/vars"
import { getAssetImageMetadata } from "./"

export const image = express.Router()

const IMAGE_FORMATS: Types.MediaTypes[] = ["jpeg", "png", "webp", "gif", "svg"]
const CIP25_CACHE_FOLDER = "./cache/cip25"
const CIP26_CACHE_FOLDER = "./cache/cip26"
const CIP68_CACHE_FOLDER = "./cache/cip68"
!fs.existsSync(CIP25_CACHE_FOLDER) && fs.mkdirSync(CIP25_CACHE_FOLDER, { recursive: true })
!fs.existsSync(CIP26_CACHE_FOLDER) && fs.mkdirSync(CIP26_CACHE_FOLDER, { recursive: true })
!fs.existsSync(CIP68_CACHE_FOLDER) && fs.mkdirSync(CIP68_CACHE_FOLDER, { recursive: true })

image.get("/:fingerprint", async (req, res) => {
  try {
    const fingerprint = req.params.fingerprint
    const crop = req.query.crop === "true"
    const select = req.query.select
    const size = isNaN(Number(req.query.size)) ? "original" : Number(req.query.size)
    const webpSupported = req.headers.accept?.includes("image/webp")

    if (size !== "original" && size > MAX_IMAGE_SIZE) {
      res.status(400).send(`Invalid Request :: size > ${MAX_IMAGE_SIZE}, should be <= ${MAX_IMAGE_SIZE}`)
      return
    }

    const asset = await getAssetImageMetadata(fingerprint)

    if (!asset) {
      res.status(404).send(`Image Not Found :: ${fingerprint}`)
      return
    }

    const cip25_metadata = asset?.cip25 ? Utils.JSONBigStringifiedBigInt(asset?.cip25) : null
    const cip26_metadata = asset?.cip26.fingerprint ? asset?.cip26 : null
    const cip68_datum = asset?.cip68 ? Utils.JSONBigStringifiedBigInt(asset?.cip68) : null

    const transformMetadata = (metadata: any, fields: string[]) => {
      const updatedFields = fields.reduce((acc, field) => {
        const rawField = metadata?.[field]
        if (rawField) {
          const finalField = Array.isArray(rawField) ? rawField.join("") : rawField
          if (typeof finalField === "string") {
            acc[field] = finalField
          } else {
            acc[field] = undefined
          }
        }
        return acc
      }, {} as any)
      return updatedFields
    }

    const cip25_images = transformMetadata(cip25_metadata, ["image"])
    const cip26_images = transformMetadata(cip26_metadata, ["logo"])
    const cip68_images = transformMetadata(cip68_datum, ["image", "logo"])

    const imageData = (() => {
      if (select === "cip68") {
        return {
          type: "cip68",
          value: cip68_images.image || cip68_images.logo,
        }
      }
      if (select === "cip25") {
        return {
          type: "cip25",
          value: cip25_images.image,
        }
      }
      if (select === "cip26") {
        return {
          type: "cip26",
          value: cip26_images.logo,
        }
      }
      if (cip68_images?.image || cip68_images?.logo) {
        return {
          type: "cip68",
          value: cip68_images.image || cip68_images.logo,
        }
      }
      if (cip25_images?.image) {
        return {
          type: "cip25",
          value: cip25_images.image,
        }
      }
      if (cip26_images?.logo) {
        return {
          type: "cip26",
          value: cip26_images.logo,
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

      if (imageProvider?.type === "ipfs" && imageProvider.value) {
        try {
          const imageResponse = await Kubo.getImage(imageProvider.value)
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

    res.status(404).send(`Image Server :: Error :: Image Not Found :: ${fingerprint}`)
  } catch (error: any) {
    logger(`Error :: ${JSON.stringify(error?.message)} :: ${JSON.stringify(error)}`)
    res.status(500).send("Internal Server Error")
  }
})
