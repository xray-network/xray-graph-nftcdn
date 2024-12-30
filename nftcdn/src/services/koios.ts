import KoiosClient from "cardano-koios-client"
import { KOIOS_HOST, KOIOS_PORT, JWT_BEARER_TOKEN, NETWORK } from "../config"

const koiosProtocolAndHost = KOIOS_HOST?.startsWith("http") ? KOIOS_HOST?.split("://") : [undefined, KOIOS_HOST]
const koiosProtocol = koiosProtocolAndHost?.[0] === "https" ? "https" : "http"
const koiosHost = koiosProtocolAndHost?.[1]
const koiosPort = KOIOS_PORT
const koiosUrl = `${koiosProtocol}://${koiosHost}${koiosPort ? `:${koiosPort}` : ""}`

const headers = {
  ...(JWT_BEARER_TOKEN && {
    "Bearer-Resolver": `${JWT_BEARER_TOKEN}`,
    "Host-Resolver": `koios/${NETWORK}`,
  }),
}
const client = KoiosClient(koiosUrl, headers)

export const getAssetsMetadata = (assets: string[][]) => {
  return client.POST("/asset_info", {
    body: {
      _asset_list: assets,
    },
  })
}
