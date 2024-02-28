export const latestShelleySlotByNetwork: {
  [k: string]: {
    id: string
    slot: number
  }
} = {
  mainnet: {
    id: "69c44ac1dda2ec74646e4223bc804d9126f719b1c245dadc2ad65e8de1b276d7",
    slot: 23068793,
  },
  preprod: {
    id: "af5fddc7d16a349e1a2af8ba89f4f5d3273955a13095b3709ef6e3db576a0b33",
    slot: 1382348,
  },
  preview: {
    id: "268ae601af8f9214804735910a3301881fbe0eec9936db7d1fb9fc39e93d1e37",
    slot: 0,
  },
}

// Interesting resume blocks (-1) for development

// XD first mint (721 Metadata)
// const latestShelleySlot = {
//   id: "6c55c64cb98ddb2b5bbce6f4145fe902a87225330517cea2f4b069d5404040f2",
//   slot: 34877025,
// }

// XD second mint
// const latestShelleySlot = {
//   id: "a4931c75421bf87da8dc76fa74045befc487e83013649adfeeab73392de3c60f",
//   slot: 37469375,
// }

// XD fourth mint (deduction)
// const latestShelleySlot = {
//   id: "243717afc2e67958aafc8e679ae32f4979d24b4caa19441345b6ed71d6e91690",
//   slot: 75657204,
// }

// Unsigned Space
// const latestShelleySlot = {
//   id: "b94b999be8a9be6d5b1ba80c2aa198c175d615e08425f0df090bbeb475207b44",
//   slot: 34887449,
// }

// Datum SpaceBudz
// const latestShelleySlot = {
//   id: "1e5337cd54e6e9df6845d6d7146e1e1c9c3b52bc765e8fa7676707f5f4871bbd",
//   slot: 110320286,
// }
