import { KUBO_HOST, KUBO_PORT, BEARER_RESOLVER_TOKEN, AUTHORIZATION_TOKEN, NETWORK } from "../config"

const kuboProtocolAndHost = KUBO_HOST?.startsWith("http") ? KUBO_HOST?.split("://") : [undefined, KUBO_HOST]
const kuboProtocol = kuboProtocolAndHost?.[0] === "https" ? "https" : "http"
const kuboHost = kuboProtocolAndHost?.[1]
const kuboPort = KUBO_PORT
const kuboUrl = `${kuboProtocol}://${kuboHost}${kuboPort ? `:${kuboPort}` : ""}`

const headers = {
  ...(AUTHORIZATION_TOKEN && {
    Authorization: `${AUTHORIZATION_TOKEN}`,
  }),
  ...(BEARER_RESOLVER_TOKEN && {
    "Bearer-Resolver": `${BEARER_RESOLVER_TOKEN}`,
    "Host-Resolver": `kubo/${NETWORK}`,
  }),
}

export const getImage = (cid: string) => {
  return fetch(`${kuboUrl}/ipfs/${cid}`, {
    headers,
  })
}
