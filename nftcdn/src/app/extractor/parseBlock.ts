import * as Utils from "../../utils"
import * as OgmiosTypes from "@cardano-ogmios/schema"
import * as Types from "../../types"

export const parseBlock = (block: OgmiosTypes.BlockPraos) => {
  const assetsObj: Types.AssetObj = {}
  const assetMintsArray: Types.AssetMints = []
  const cip25MetadataArray: Types.Cip25MetadataArray = []
  const cip27MetadataArray: Types.Cip27MetadataArray = []
  const cip68DatumArray: Types.Cip68DatumArray = []

  block.transactions?.forEach((tx) => {
    const cip25: any = tx.metadata?.labels?.[721]?.json
    const cip27: any = tx.metadata?.labels?.[777]?.json

    // Extract tx metadata & mints
    // @@ Assets, Mints, 721 Metadata Label, 777 Metadata Label
    Object.entries(tx.mint || {}).forEach(([policy_id, asset]) => {
      Object.entries(asset).forEach(([asset_name, quantity]) => {
        const fingerprint = Utils.generateFingerprint(policy_id, asset_name) as string
        const ref_fingerprint = Utils.generateCip68Ref(policy_id, asset_name)?.fingerprint
        const assetNameAscii = Utils.decodeAssetName(asset_name)?.assetNameAscii || ""

        // Assets (as object for deduplication)
        assetsObj[fingerprint] = {
          fingerprint,
          policy_id,
          asset_name,
          ref_fingerprint,
          quantity: assetsObj[fingerprint]
            ? (BigInt(assetsObj[fingerprint].quantity) + BigInt(quantity)).toString()
            : quantity.toString(),
        }

        // Asset mints
        assetMintsArray.push({
          slot: block.slot,
          tx_id: tx.id,
          fingerprint,
          quantity: quantity.toString(),
        })

        // 721 Metadata Label: CIP-0025 (Media token), CIP-0060 (Music token) Metadata
        const cip25AssetMetadataJson = cip25?.[policy_id]?.[asset_name] || cip25?.[policy_id]?.[assetNameAscii] // CIP-0068 v2 and v1
        if (cip25AssetMetadataJson) {
          cip25MetadataArray.push({
            slot: block.slot,
            fingerprint,
            metadata: Utils.JSONBigStringify(cip25AssetMetadataJson),
          })
        }

        // 777 Metadata Label: CIP-0027 (Royalties) Metadata
        const cip27AssetMetadataJson = cip27?.[policy_id]?.[asset_name] || cip27?.[policy_id]?.[assetNameAscii] // CIP-0068 v2 and v1
        if (cip27AssetMetadataJson) {
          cip27MetadataArray.push({
            slot: block.slot,
            fingerprint,
            metadata: Utils.JSONBigStringify(cip27AssetMetadataJson),
          })
        }
      })
    })

    // Extract output datums and related assets
    // @@ 100 Datum Label
    tx.outputs?.forEach((output) => {
      Object.entries(output.value).forEach(([policy_id, asset]) => {
        if (policy_id == "ada") return
        Object.entries(asset).forEach(([asset_name]) => {
          const fingerprint = Utils.generateFingerprint(policy_id, asset_name) as string
          const datumBytes = output.datumHash ? (tx.datums || {})[output.datumHash] : output.datum
          const datumIsInline = datumBytes ? (!output.datumHash ? 1 : 0) : 0
          const datumInlineHash = datumIsInline && datumBytes ? Utils.hashPlutusData(datumBytes) : undefined
          const datumHash = output.datumHash || datumInlineHash

          // @@ 100 Datum Label (process all tokens with datum and CIP-0068 (100) ref token label)
          if (datumBytes && datumHash && asset_name.startsWith("000643b0")) {
            const cip68DatumJsValue = Utils.plutusDataToJsValue(datumBytes)
            const cip68DatumJsonParsed = Utils.parsePlutusJsonData(cip68DatumJsValue)
            const cip68DatumJson = cip68DatumJsonParsed?.[0]
            if (cip68DatumJson) {
              cip68DatumArray.push({
                slot: block.slot,
                fingerprint,
                datum_hash: datumHash,
                datum: Utils.JSONBigStringify(cip68DatumJson),
                is_inline: datumIsInline,
              })
            }
          }
        })
      })
    })
  })

  return {
    assets: Object.values(assetsObj).map((asset) => asset),
    assetMintsArray,
    cip25MetadataArray,
    cip27MetadataArray,
    cip68DatumArray,
  }
}
