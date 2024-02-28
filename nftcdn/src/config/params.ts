import * as Types from "../types"

export const networkId = (network: Types.Network): number => {
  switch (network) {
    case "mainnet":
      return 1
    case "preprod":
      return 0
    case "preview":
      return 0
  }
}

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

export const slotLength = (network: Types.Network): number => {
  switch (network) {
    case "mainnet":
      return 432000
    case "preprod":
      return 432000
    case "preview":
      return 86400
  }
}

export const shelleyStart = (network: Types.Network): number => {
  switch (network) {
    case "mainnet":
      return 4924800
    case "preprod":
      return 4924800 + 129600 - slotLength(network)
    case "preview":
      return 0
  }
}

export const networkOffset = (network: Types.Network): number => {
  switch (network) {
    case "mainnet":
      return 1596491091
    case "preprod":
      return 1599294016 + 129600 - slotLength(network)
    case "preview":
      return 1666656000
  }
}
