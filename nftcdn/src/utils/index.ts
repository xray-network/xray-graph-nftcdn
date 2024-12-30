import AssetFingerprint from "@emurgo/cip14-js"
import * as Types from "../types"
import { labelType } from "../config"
import { crc8 } from "./crc8"
import * as isIPFS from "is-ipfs"
import { sha224, sha256 } from "js-sha256"

export const logger = (output: string) => {
  console.log(`${new Date().toISOString()} — ${output}`)
}

export const getSha224 = (message: string) => {
  try {
    return message ? sha224(message) : undefined
  } catch (error) {
    logger(`Server :: getSha256 :: ${error}`)
    return undefined
  }
}

export const getSha256 = (message: string) => {
  try {
    return message ? sha256(message) : undefined
  } catch (error) {
    logger(`Server :: getSha256 :: ${error}`)
    return undefined
  }
}

export const cip67Crc8Checksum = (num: string): string => {
  return crc8(Buffer.from(num, "hex")).toString(16).padStart(2, "0")
}

export function cip67ToLabel(num: number): string | undefined {
  if (num <= 0 || num > 65535) {
    logger(`Label ${num} out of range: min label 1 - max label 65535.`)
    return undefined
  }
  const numHex = num.toString(16).padStart(4, "0")
  return "0" + numHex + cip67Crc8Checksum(numHex) + "0"
}

export function cip67FromLabel(label: string): number | undefined {
  if (label.length !== 8 || !(label[0] === "0" && label[7] === "0")) {
    return undefined
  }
  const numHex = label.slice(1, 5)
  const num = parseInt(numHex, 16)
  const check = label.slice(5, 7)
  return check === cip67Crc8Checksum(numHex) ? num : undefined
}

export const generateFingerprint = (policyId: string, assetName?: string) => {
  try {
    const fingerprint = AssetFingerprint.fromParts(Buffer.from(policyId, "hex"), Buffer.from(assetName || "", "hex"))
    return fingerprint.fingerprint()
  } catch (error) {
    logger(`Server :: generateFingerprint :: ${error}`)
    return undefined
  }
}

export const generateCip68Ref = (policyId: string, assetName?: string) => {
  try {
    const labelRef = "000643b0"
    const labelHex = (assetName || "").substring(0, 8)
    const assetNameHex = (assetName || "").substring(8)
    const label = cip67FromLabel(labelHex)
    if (label && label !== 100) {
      const assetNameNew = labelRef + assetNameHex
      return {
        policyId,
        assetName: assetNameNew,
        fingerprint: generateFingerprint(policyId, assetNameNew),
      }
    } else {
      return undefined
    }
  } catch (error) {
    logger(`Server :: generateCip68Ref :: ${error}`)
    return undefined
  }
}

export const extractCid = (imageUrl: string) => {
  try {
    const cid = imageUrl
      .replace("ipfs://", "")
      .replace("ipfs:/", "")
      .replace("ipfs:", "")
      .replace("/ipfs/", "")
      .replace("ipfs/", "")
    const cidPart = cid.split("/")[0]
    const detected = isIPFS.cid(cidPart)
    return {
      isIPFS: detected,
      cid: detected ? cid : undefined,
    }
  } catch (error) {
    logger(`Server :: extractCid :: ${error}`)
    return undefined
  }
}

export const getImageProvider = (imageUrl: string) => {
  try {
    const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
    const cid = extractCid(imageUrl)
    const [, base64raw] = imageUrl.split(";base64,")
    if (cid?.isIPFS) {
      return {
        type: "ipfs",
        value: cid.cid,
      }
    } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return {
        type: "http",
        value: imageUrl,
      }
    } else if (base64regex.test(imageUrl)) {
      return {
        type: "base64",
        value: imageUrl,
      }
    } else if (base64regex.test(base64raw)) {
      return {
        type: "base64",
        value: base64raw,
      }
    } else {
      return {
        type: "unknown",
        value: imageUrl,
      }
    }
  } catch (error) {
    logger(`Server :: getImageProvider :: ${error}`)
    return undefined
  }
}

export function parsePlutusJsonData(input: any, bigintAsString?: boolean, rawBytes?: boolean): any {
  try {
    if (input.hasOwnProperty("bytes")) {
      return rawBytes ? input.bytes : Buffer.from(input.bytes, "hex").toString()
    } else if (input.hasOwnProperty("int")) {
      return bigintAsString ? input.int : BigInt(input.int)
    } else if (input.hasOwnProperty("map")) {
      const obj: any = {}
      input.map.forEach((item: any) => {
        const preventKeys = ["sha256"]
        const key = parsePlutusJsonData(item.k)
        const value = parsePlutusJsonData(item.v, bigintAsString, preventKeys.includes(key))
        obj[key] = value
      })
      return obj
    } else if (input.hasOwnProperty("list")) {
      return input.list.map(parsePlutusJsonData)
    } else if (input.hasOwnProperty("fields")) {
      return input.fields.map(parsePlutusJsonData)
    }
    return input
  } catch (error) {
    logger(`Cardano Lib Error :: parsePlutusJsonData :: ${error}`)
    return undefined
  }
}

export const joinMetadata = (metadata: any, fields: string[]) => {
  const updatedFields = fields.reduce((acc, field) => {
    const rawField = metadata?.[field]
    if (rawField) {
      const finalField = Array.isArray(rawField) ? rawField.join("") : rawField
      if (typeof finalField === "string") {
        acc[field] = finalField
      } else {
        acc[field] = undefined
      }
    }
    return acc
  }, {} as any)
  return updatedFields
}
