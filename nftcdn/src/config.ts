import "dotenv/config"
import * as Types from "./types"
import { version } from "../package.json"

export const NETWORK = process.env.NETWORK || "mainnet"
export const IMAGE_SIZES = (process.env.IMAGE_SIZES ? JSON.parse(process.env.IMAGE_SIZES) : []) as any
export const JWT_BEARER_TOKEN = process.env.JWT_BEARER_TOKEN

export const KOIOS_HOST = process.env.KOIOS_HOST
export const KOIOS_PORT = Number(process.env.KOIOS_PORT)

export const KUBO_HOST = process.env.KUBO_HOST
export const KUBO_PORT = Number(process.env.KUBO_PORT)

export const IMAGE_FORMATS: Types.MediaTypes[] = ["jpeg", "png", "webp", "gif", "svg"]

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

export const OPEN_API_CONFIG = {
  openapi: "3.1.0",
  info: {
    version,
    title: "XRAY/Graph NFTCDN",
    description: "XRAY/Graph NFTCDN — A caching and image server for Cardano tokens, integrated with an IPFS gateway",
  },
}

export const OPEN_API_HTML = `
    <!doctype html>
    <html>
    <head>
      <title>XRAY/Graph NFTCDN</title>
			<link rel="icon" href="https://cdn.xray.app/logo/xray-blue.svg" />
			<link rel="stylesheet" href="https://cdn.xray.app/fonts/satoshi.css" type="text/css" media="all" />
      <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
			<style>
				rapi-doc::part(section-navbar) { border-right: 1px solid #dadde1; padding-top: 10px; }
				rapi-doc::part(section-header) { box-shadow: 0 1px 2px 0 #0000001a; position: relative; z-index: 100; }
			</style>
    </head>
    <body>
      <rapi-doc 
				spec-url="openapi.json"
				server-url="."
				allow-spec-url-load="true"
				allow-spec-file-load="false"
				show-header="true"
				show-info="true"
				allow-server-selection="false"
				allow-authentication="false"
				allow-api-list-style-selection="true"
				render-style="focused"
				schema-style="table"
				allow-try="true"
				heading-text="XRAY/Graph NFTCDN"
				on-nav-tag-click="show-description"
				update-route="true"
				use-path-in-nav-bar="false"
				nav-item-spacing="default"
				show-components="false"
				fill-request-fields-with-example="true"
				schema-style="table"
				default-schema-tab="schema"
				schema-description-expanded="false"
				schema-expand-level="1"
				load-fonts="true"
				font-size="default"
				show-method-in-nav-bar="as-colored-text"
				nav-active-item-marker="colored-block"
				allow-schema-description-expand-toggle="true"
				show-curl-before-try="true"
				schema-hide-read-only="never"
				mono-font="monospace"
				regular-font="Satoshi"
				header-color="#ffffff"
				primary-color="#1940ed"
				bg-color="#ffffff"
				text-color="#1c1e21"
				nav-bg-color="#ffffff"
      >
				<img slot="logo" src="https://cdn.xray.app/logo/xray-blue.svg" style="height: 36px; margin-left: 10px" />	
			</rapi-doc>
			<!--
				theme="dark"
				header-color="#06050c"
				primary-color="#4c82fb"
				bg-color="#110f1c"
				text-color="#e3e3e3"
				nav-bg-color="#110f1c"
			-->
    </body>
    </html>
  `
