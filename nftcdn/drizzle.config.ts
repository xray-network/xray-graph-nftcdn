import "dotenv/config"
import type { Config } from "drizzle-kit"
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  driver: "pg",
} satisfies Config