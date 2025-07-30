import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { stream } from "hono/streaming"
import { z } from "zod"
import { logger } from "../utils"
import * as Kubo from "../services/kubo"

export const ipfsRouter = new OpenAPIHono()

const ipfsRoute = createRoute({
  tags: ["IPFS"],
  method: "get",
  security: [
    {
      bearerAuth: [],
    },
  ],
  path: "/ipfs/{cid}",
  summary: "Get image from IPFS by CID",
  description:
    "The image is fetched by CID from the IPFS gateway. The CID is the unique identifier of the image on the IPFS network.",
  request: {
    params: z.object({
      cid: z
        .string()
        .openapi({ description: "The CID of the image", example: "QmaYWWWmrUJkWiKAaHRiYwLaSCNGT8he4ZpuQd5TddvRVJ" }),
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
  },
})

ipfsRouter.openapi(ipfsRoute, async (ctx) => {
  const cid = ctx.req.param("cid")
  const imageResponse = await Kubo.getImage(cid)
  return (ctx.res = new Response(imageResponse.body, {
    status: imageResponse.status,
    headers: imageResponse.headers,
  }))
})
