import "dotenv/config"

export const NETWORK = process.env.NETWORK || "mainnet"

export const OGMIOS_HOST = process.env.OGMIOS_HOST
export const OGMIOS_PORT = Number(process.env.OGMIOS_PORT)

export const KUBO_HOST = process.env.KUBO_HOST
export const KUBO_PORT = Number(process.env.KUBO_PORT)

export const POSTGRES_USER = process.env.POSTGRES_USER
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD
export const POSTGRES_HOST = process.env.POSTGRES_HOST
export const POSTGRES_PORT = Number(process.env.POSTGRES_PORT)
export const POSTGRES_DB = process.env.POSTGRES_DB
export const DB_URI = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`
export const DB_URI_POSTGRES = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/postgres`

export const SERVER_IMAGE_URL = process.env.SERVER_IMAGE_URL || `https://graph.xray.app/output/nftcdn/${NETWORK}/api/v1`
export const MAX_IMAGE_SIZE = Number(process.env.MAX_IMAGE_SIZE)
