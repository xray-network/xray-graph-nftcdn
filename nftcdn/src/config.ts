import "dotenv/config"
import * as Types from "./types"

export const NETWORK = process.env.NETWORK || "mainnet"
export const IMAGE_SIZES = process.env.IMAGE_SIZES ? JSON.parse(process.env.IMAGE_SIZES) : []
export const JWT_BEARER_TOKEN = process.env.JWT_BEARER_TOKEN

export const KOIOS_HOST = process.env.KOIOS_HOST
export const KOIOS_PORT = Number(process.env.KOIOS_PORT)

export const KUBO_HOST = process.env.KUBO_HOST
export const KUBO_PORT = Number(process.env.KUBO_PORT)

export const IMAGE_FORMATS: Types.MediaTypes[] = ["jpeg", "png", "webp", "gif", "svg"]

export const labelType = (label: number): string | undefined => {
  switch (label) {
    case 100:
      return "ref"
    case 222:
      return "nft"
    case 333:
      return "ft"
    case 444:
      return "rft"
    case 500:
      return "royalty"
    default:
      return undefined
  }
}
