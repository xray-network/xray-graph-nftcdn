import { KUBO_HOST, KUBO_PORT } from "../config/vars"

const kuboProtocolAndHost = KUBO_HOST?.startsWith("http") ? KUBO_HOST?.split("://") : [undefined, KUBO_HOST]
const kuboProtocol = kuboProtocolAndHost?.[0] === "https" ? "https" : "http"
const kuboHost = kuboProtocolAndHost?.[1]
const kuboPort = KUBO_PORT
const kuboUrl = `${kuboProtocol}://${kuboHost}${kuboPort ? `:${kuboPort}` : ""}`

export const getImage = (cid: string) => {
  return fetch(`${kuboUrl}/ipfs/${cid}`)
}
