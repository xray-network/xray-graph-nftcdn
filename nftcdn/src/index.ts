import { OpenAPIHono } from "@hono/zod-openapi"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { logger } from "./utils"
import { OPEN_API_CONFIG, OPEN_API_HTML } from "./config"
import { imageRouter } from "./app/image"
import { metadataRouter } from "./app/metadata"
import { ipfsRouter } from "./app/ipfs"

// Initialize OpenAPIHono
const app = new OpenAPIHono()
app.use("/*", cors())

// Routes
app.route("/", imageRouter)
app.route("/", metadataRouter)
app.route("/", ipfsRouter)

// Initialize OpenAPI
app.doc("/openapi.json", OPEN_API_CONFIG)
app.get("/", (ctx) => ctx.html(OPEN_API_HTML))

console.log("Server is running on http://127.0.0.1:4700")

serve({
  fetch: app.fetch,
  port: 4700,
})
