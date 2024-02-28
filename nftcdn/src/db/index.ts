import { drizzle } from "drizzle-orm/postgres-js"
import postgresClient from "postgres"
import * as schema from "./schema"
export * as schema from "./schema"
import { DB_URI } from "../config/vars"

export const postgres = postgresClient(DB_URI)
export const db = drizzle(postgres)
