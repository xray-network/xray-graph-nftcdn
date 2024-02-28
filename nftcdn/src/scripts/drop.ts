import postgresClient from "postgres"
import { DB_URI_POSTGRES } from "../config/vars"

export const dropDatabase = async (): Promise<void> => {
  const postgres = postgresClient(DB_URI_POSTGRES, { max: 1 })
  await postgres.unsafe(`DROP DATABASE IF EXISTS "${process.env.POSTGRES_DB}"`)
  await postgres.unsafe(`CREATE DATABASE "${process.env.POSTGRES_DB}"`)
  await postgres.end()
}

dropDatabase()
  .then(() => {
    console.log("DB :: Delete :: success!")
    process.exit(0)
  })
  .catch((err) => {
    console.error("DB :: Delete :: failed!")
    console.log(err)
    process.exit(1)
  })
