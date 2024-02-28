export type Network = "mainnet" | "preview" | "preprod"
export type NetworkMap = Record<Network, number>
export type NetworkSlotMap = Record<Network, number>

export type MediaTypes = "jpeg" | "png" | "webp" | "gif" | "svg"

export type AssetObj = {
  [k: string]: {
    fingerprint: string
    policy_id: string
    asset_name: string
    ref_fingerprint?: string
    quantity: string
  }
}

export type AssetMints = {
  slot: number
  tx_id: string
  fingerprint: string
  quantity: string
}[]

export type Cip25MetadataArray = {
  slot: number
  fingerprint: string
  metadata: string
}[]

export type Cip27MetadataArray = {
  slot: number
  fingerprint: string
  metadata: string
}[]

export type Cip68DatumArray = {
  slot: number
  fingerprint: string
  datum_hash: string
  datum: string
  is_inline: 0 | 1
}[]

export type Cip26MetadataArray = {
  slot: number
  fingerprint: string
  policy_id: string
  asset_name: string
  decimals: number
  description: string
  name: string
  ticker: string
  image: string
  url: string
}[]
