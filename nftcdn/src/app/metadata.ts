import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { stream } from "hono/streaming"
import { z } from "zod"
import { logger } from "../utils"
import * as Koios from "../services/koios"

export const metadataRouter = new OpenAPIHono()

const getRoute = createRoute({
  tags: ["Tokens"],
  method: "get",
  path: "/metadata/{id}",
  summary: "Get metadata by token ID",
  description:
    "Proxy to Koios API to get metadata by token ID. Find latest version of object definition here https://api.koios.rest/#post-/asset_info",
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "The ID of token (Policy ID + Asset Name)",
        example: "b6798a74fb7441ef5f7af1ff4ea6150bbb7aaeb0aca0113e558592f6584449414d4f4e44",
      }),
    }),
  },
  responses: {
    200: {
      description: "The response from the server",
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

metadataRouter.openapi(getRoute, async (ctx) => {
  const assetIdRaw = ctx.req.param("id")
  const assetId = [assetIdRaw.slice(0, 56), assetIdRaw.slice(56)]

  const response = (await Koios.getAssetsMetadata([assetId])).data || []
  console.log("Metadata response:", await Koios.getAssetsMetadata([assetId]))

  if (!response.length) {
    return ctx.text("Metadata Not Found", 404)
  }

  return ctx.json(response[0], 200)
})

const postRoute = createRoute({
  tags: ["Tokens"],
  method: "post",
  path: "/metadata",
  summary: "Get metadata by token ID (bulk)",
  description:
    "Proxy to Koios API to get metadata by token ID. Find latest version of object definition here https://api.koios.rest/#post-/asset_info",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            _asset_list: z.array(z.string().array()).openapi({
              description: "Array of array of Policy ID and Asset Name",
              example: [
                ["b6798a74fb7441ef5f7af1ff4ea6150bbb7aaeb0aca0113e558592f6", "584449414d4f4e44"],
                ["86abe45be4d8fb2e8f28e8047d17d0ba5592f2a6c8c452fc88c2c143", "58524159"],
              ],
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The response from the server",
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

metadataRouter.openapi(postRoute, async (ctx) => {
  const { _asset_list } = ctx.req.valid("json")
  const response = (await Koios.getAssetsMetadata(_asset_list)).data || []

  if (!response.length) {
    return ctx.text("Metadata Not Found", 404)
  }

  return ctx.json(response, 200)
})
