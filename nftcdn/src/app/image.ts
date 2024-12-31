import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { stream } from "hono/streaming"
import { z } from "zod"
import fs from "fs"
import sharp from "sharp"
import * as Types from "../types"
import { logger } from "../utils"
import * as Utils from "../utils"
import * as Koios from "../services/koios"
import * as Kubo from "../services/kubo"
import { IMAGE_SIZES, IMAGE_FORMATS } from "../config"

export const imageRouter = new OpenAPIHono()

const imageRoute = createRoute({
  tags: ["Tokens"],
  method: "get",
  path: "/image/{id}",
  summary: "Get (cached) image by token ID",
  description: "Image is fetched by token ID from the NFTCDN cache.",
  request: {
    query: z.object({
      crop: z.coerce
        .boolean()
        .optional()
        .openapi({
          description: "Crop the image. Only works with size set",
          example: false,
        })
        .default(false),
      prefer: z
        .enum(["cip25", "cip26", "cip68"])
        .optional()
        .openapi({
          description:
            "Prefer image type. If not selected, the first available image type will be used in next order cip68 > cip25 > cip26",
        })
        .default("cip68"),
      size: z
        .enum(IMAGE_SIZES)
        .optional()
        .openapi({
          description: "Image size",
        })
        .default("original"),
    }),
    params: z.object({
      id: z.string().openapi({
        description: "Token ID (Policy ID + Asset Name)",
        example: "b6798a74fb7441ef5f7af1ff4ea6150bbb7aaeb0aca0113e558592f6584449414d4f4e44",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/image": {
          schema: z.string().openapi({
            type: "string",
            format: "binary",
          }),
        },
      },
      description: "The response from the server",
    },
    400: {
      content: {
        "application/text": {
          schema: z.string(),
        },
      },
      description: "Error: Metadata Not Found",
    },
    404: {
      content: {
        "application/text": {
          schema: z.string(),
        },
      },
      description: "Error: Metadata Not Found",
    },
  },
})

imageRouter.openapi(imageRoute, async (ctx) => {
  const assetIdRaw = ctx.req.param("id")
  const assetId = [assetIdRaw.slice(0, 56), assetIdRaw.slice(56)]

  const { crop, prefer, size: __size } = ctx.req.valid("query")
  const webpSupported = ctx.req.header("accept")?.includes("image/webp")
  const size = __size === "original" ? "original" : Number(__size)

  if (size !== "original" && !IMAGE_SIZES.includes(size.toString())) {
    ctx.status(400)
    return ctx.text(`Invalid Request :: Select correct size :: ${IMAGE_SIZES.join(", ")}`)
  }

  const assetMetadata = (await Koios.getAssetsMetadata([assetId]))?.data?.[0]
  if (!assetMetadata) {
    ctx.status(404)
    return ctx.text(`Image Not Found :: ${assetIdRaw}`)
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
        return (ctx.res = new Response(fs.readFileSync(`${imagePath}.webp`), {
          headers: {
            "content-type": "image/webp",
            "cache-control": "public, max-age=31536000, immutable",
          },
        }))
      }
      const format = cachedFiles.filter((format) => format !== "webp")[0]
      if (format) {
        return (ctx.res = new Response(fs.readFileSync(`${imagePath}.${format}`), {
          headers: {
            "content-type": `image/${format}`,
            "cache-control": "public, max-age=31536000, immutable",
          },
        }))
      }
    }

    // Remote Image Processing
    const processRemote = async (imageResponse: Response, cache: boolean) => {
      const contentType = (imageResponse.headers.get("content-type") || "")?.split("/")
      const typeRaw = contentType[0] as any
      const formatRaw = contentType[1] as Types.MediaTypes
      if (typeRaw === "image" && IMAGE_FORMATS.includes(formatRaw)) {
        if (size === "original" || formatRaw === "svg") {
          return (ctx.res = new Response(imageResponse.body, {
            status: imageResponse.status,
            headers: {
              ...imageResponse.headers,
              "content-type": `image/${formatRaw}`,
              "cache-control": "public, max-age=31536000, immutable",
            },
          }))
        } else {
          const format = webpSupported ? "webp" : formatRaw
          const sharpImage = sharp(await imageResponse.arrayBuffer(), {
            animated: true,
            limitInputPixels: 268402689 * 5,
          })
          const sharpResized = crop ? sharpImage.resize(size, size, { fit: "cover" }) : sharpImage.resize(size)
          cache && (await sharpResized.toFormat(format).toFile(`${imagePath}.${format}`))
          return (ctx.res = new Response(await sharpResized.toBuffer(), {
            status: imageResponse.status,
            headers: {
              ...imageResponse.headers,
              "content-type": `image/${format}`,
              "cache-control": "public, max-age=31536000, immutable",
            },
          }))
        }
      }
    }

    const imageProvider = Utils.getImageProvider(imageData?.value)

    // IPFS Image Processing
    if (imageProvider?.type === "ipfs" && imageProvider.value) {
      const imageResponse = await Kubo.getImage(imageProvider.value)
      if (imageResponse.ok) {
        await processRemote(imageResponse, true)
        return ctx.res
      }
    }

    // HTTP Image Processing
    if (imageProvider?.type === "http" && imageProvider.value) {
      if (size === "original") {
        return ctx.redirect(imageData.value, 301)
      } else {
        const imageResponse = await fetch(imageProvider.value)
        if (imageResponse.ok) {
          await processRemote(imageResponse, false) // There is no cache as the image is retrieved from the mutable source
          return ctx.res
        }
      }
    }

    // Base64 Image Processing
    if (imageProvider?.type === "base64" && imageProvider.value) {
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
      return (ctx.res = new Response(await sharpFormatted.toBuffer(), {
        status: 200,
        headers: {
          "content-type": `image${format ? `/${format}` : ""}`,
          "cache-control": "public, max-age=31536000, immutable",
        },
      }))
    }
  }

  ctx.status(404)
  return ctx.text(`Image Not Found :: ${assetIdRaw}`)
})
