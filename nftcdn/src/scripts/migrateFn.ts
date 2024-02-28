import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import postgresClient from "postgres"
import { DB_URI } from "../config/vars"

export const dbMigrate = async () => {
  const postgres = postgresClient(DB_URI, { max: 1 })
  const db = drizzle(postgres)
  await migrate(db, { migrationsFolder: "./src/db/migrations" })
  await postgres.end()
}
