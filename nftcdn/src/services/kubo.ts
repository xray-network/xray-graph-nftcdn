import { KUBO_HOST, KUBO_PORT, JWT_BEARER_TOKEN, NETWORK } from "../config"

const kuboProtocolAndHost = KUBO_HOST?.startsWith("http") ? KUBO_HOST?.split("://") : [undefined, KUBO_HOST]
const kuboProtocol = kuboProtocolAndHost?.[0] === "https" ? "https" : "http"
const kuboHost = kuboProtocolAndHost?.[1]
const kuboPort = KUBO_PORT
const kuboUrl = `${kuboProtocol}://${kuboHost}${kuboPort ? `:${kuboPort}` : ""}`

const headers = {
  ...(JWT_BEARER_TOKEN && {
    "Bearer-Resolver": `${JWT_BEARER_TOKEN}`,
    "Host-Resolver": `kubo/${NETWORK}`,
  }),
}

export const getImage = (cid: string) => {
  return fetch(`${kuboUrl}/ipfs/${cid}`, {
    headers,
  })
}
