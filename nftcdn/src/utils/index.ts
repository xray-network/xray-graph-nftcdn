import * as CML from "@dcspark/cardano-multiplatform-lib-nodejs"
import AssetFingerprint from "@emurgo/cip14-js"
import * as Types from "../types"
import { networkId, shelleyStart, networkOffset, labelType } from "../config/params"
import { crc8 } from "./crc8"
import * as isIPFS from "is-ipfs"
import { sha224, sha256 } from "js-sha256"
// @ts-ignore
import JSONBig from "@cardanosolutions/json-bigint"

export const logger = (output: string) => {
  console.log(`${new Date().toISOString()} — ${output}`)
}

export const JSONBigStringifiedBigInt = (data: any) => {
  try {
    return data ? JSON.parse(JSON.stringify(JSONBig.parse(data))) : undefined
  } catch (error) {
    logger(`Cardano Lib Error :: JSONBigStringToJsonStringify :: ${error}`)
    return undefined
  }
}

export const JSONBigStringify = (data: any) => {
  try {
    return data ? JSONBig.stringify(data) : undefined
  } catch (error) {
    logger(`Cardano Lib Error :: JSONBigStringify :: ${error}`)
    return undefined
  }
}

export const JSONBigParse = (data: any) => {
  try {
    return data ? JSONBig.parse(data) : undefined
  } catch (error) {
    logger(`Cardano Lib Error :: JSONBigParse :: ${error}`)
    return undefined
  }
}

export const getSha224 = (message: string) => {
  try {
    return message ? sha224(message) : undefined
  } catch (error) {
    logger(`Cardano Lib Error :: getSha256 :: ${error}`)
    return undefined
  }
}

export const getSha256 = (message: string) => {
  try {
    return message ? sha256(message) : undefined
  } catch (error) {
    logger(`Cardano Lib Error :: getSha256 :: ${error}`)
    return undefined
  }
}

export const plutusDataToJsValue = (datum: string) => {
  try {
    return JSON.parse(CML.decode_plutus_datum_to_json_str(CML.PlutusData.from_cbor_hex(datum), 1))
  } catch (error) {
    logger(`Cardano Lib Error :: plutusDataToJsValue :: ${error}`)
    return undefined
  }
}

export const plutusDataToJson = (datum: string) => {
  try {
    return JSON.parse(CML.decode_plutus_datum_to_json_str(CML.PlutusData.from_cbor_hex(datum), 0))
  } catch (error) {
    logger(`Cardano Lib Error :: plutusDataToJson :: ${error}`)
    return undefined
  }
}

export function parsePlutusJsonData(input: any, preventEncode?: boolean): any {
  try {
    if (input.hasOwnProperty("bytes")) {
      return preventEncode ? input.bytes : Buffer.from(input.bytes, "hex").toString()
    } else if (input.hasOwnProperty("int")) {
      return BigInt(input.int)
    } else if (input.hasOwnProperty("map")) {
      const obj: any = {}
      input.map.forEach((item: any) => {
        const preventKeys = ["sha256"]
        const key = parsePlutusJsonData(item.k)
        const value = parsePlutusJsonData(item.v, preventKeys.includes(key))
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

export const hashPlutusData = (datum: string) => {
  try {
    return CML.hash_plutus_data(CML.PlutusData.from_cbor_hex(datum)).to_hex()
  } catch (error) {
    logger(`Cardano Lib Error :: hashPlutusData :: ${error}`)
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
    logger(`Cardano Lib Error :: generateFingerprint :: ${error}`)
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
    logger(`Cardano Lib Error :: generateCip68Ref :: ${error}`)
    return undefined
  }
}

export const decodeAssetName = (assetName: string) => {
  try {
    const decode = (assetName: string) => {
      const labelHex = (assetName || "").substring(0, 8)
      const assetNameHex = (assetName || "").substring(8)
      const label = cip67FromLabel(labelHex)
      if (label) {
        return {
          assetNameAsciiNoLabel: Buffer.from(assetNameHex || "", "hex").toString("utf-8") || "",
          label: labelHex,
          labelAscii: label,
          labelType: labelType(label),
        }
      } else {
        return undefined
      }
    }
    const decoded = decode(assetName)
    const assetNameAscii = Buffer.from(assetName || "", "hex").toString("utf-8") || ""
    const assetNameAsciiNoLabel = decoded?.assetNameAsciiNoLabel || assetNameAscii
    const format = /^([/\\\[\]*<>(),.!?@+=%&$#^'"|a-zA-Z0-9 _-]+)$/
    const assetNameFormatted = format.test(assetNameAsciiNoLabel) ? assetNameAsciiNoLabel : assetName
    const assetNameFull = (decoded?.label ? `(${decoded?.labelAscii}) ` : "") + assetNameFormatted
    return {
      assetName: assetName,
      assetNameAscii: assetNameAscii,
      assetNameAsciiNoLabel: assetNameAsciiNoLabel,
      assetNameFormatted: assetNameFormatted,
      assetNameFull: assetNameFull,
      label: decoded?.label,
      labelAscii: decoded?.labelAscii,
      labelType: decoded?.labelType,
    }
  } catch (error) {
    logger(`Cardano Lib Error :: decodeAssetName :: ${error}`)
    return undefined
  }
}

export const getStakeKeyFromAddress = (address?: string, network?: Types.Network) => {
  try {
    if (address && network) {
      if (networkId(network) === undefined) throw new Error("Wrong Network")
      if (CML.ByronAddress.is_valid(address)) return undefined
      const stakeCredential = CML.Address.from_bech32(address).staking_cred()
      return stakeCredential
        ? CML.RewardAddress.new(networkId(network), stakeCredential).to_address().to_bech32()
        : undefined
    } else {
      return undefined
    }
  } catch (error) {
    logger(`Cardano Lib Error :: getStakeKeyFromAddress :: ${error}`)
    return undefined
  }
}

export const timestampFromSlot = (slot?: number, network?: Types.Network) => {
  try {
    if (slot && network) {
      return new Date((slot - shelleyStart(network) + networkOffset(network)) * 1000).toISOString()
    } else {
      return undefined
    }
  } catch (error) {
    logger(`Cardano Lib Error :: timestampFromSlot :: ${error}`)
    return undefined
  }
}

export const slotFromTimestamp = (timestamp?: string, network?: Types.Network) => {
  try {
    if (timestamp && network) {
      return Math.floor(new Date(timestamp).getTime() / 1000) + shelleyStart(network) - networkOffset(network)
    } else {
      return undefined
    }
  } catch (error) {
    logger(`Cardano Lib Error :: slotFromTimestamp :: ${error}`)
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
    logger(`Cardano Lib Error :: extractCid :: ${error}`)
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
    logger(`Cardano Lib Error :: getImageProvider :: ${error}`)
    return undefined
  }
}
