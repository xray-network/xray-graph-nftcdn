<a href="https://discord.gg/WhZmm46APN"><img alt="Discord" src="https://img.shields.io/discord/852538978946383893?style=for-the-badge&logo=discord&label=Discord&labelColor=%231940ED&color=%233FCB9B"></a>

# XRAY/Graph NFTCDN — Dockerized Metadata/Datums indexer & Image Server with IPFS gateway

XRAY/Graph NFTCDN is a tool for caching Cardano token images & image resizer ([Sharp](https://sharp.pixelplumbing.com/)-based), IPFS Gateway ([Kubo](https://github.com/ipfs/kubo/)) in a docker environment. Used in the [XRAY/Graph](https://xray.app/) distributed Cardano API provider. Built on Koios API stack.

## Getting Started

### Prepare Installation

Clone repository:
``` console
git clone \
  https://github.com/xray-network/xray-graph-nftcdn.git \
  && cd xray-graph-nftcdn
```

Run Kubo:
``` console
docker compose -f docker-compose.kubo.yaml up -d --build
```

## MAINNET

Add `AUTHORIZATION_TOKEN` if necessary. Set `KUBO_HOST` and `KUBO_PORT` if you want to use a remote Kubo instance.

``` console
NETWORK=mainnet \
KOIOS_HOST=https://graph.xray.app/output/services/koios/mainnet/api/v1 \
docker compose -f docker-compose.yaml -p nftcdn-mainnet up -d --build
```

## PREPROD

``` console
NETWORK=preprod \
KOIOS_HOST=https://graph.xray.app/output/services/koios/preprod/api/v1 \
NFTCDN_PORT=4701 \
docker compose -f docker-compose.yaml -p nftcdn-preprod up -d --build
```

## PREVIEW

``` console
NETWORK=preview \
KOIOS_HOST=https://graph.xray.app/output/services/koios/preview/api/v1 \
NFTCDN_PORT=4702 \
docker compose -f docker-compose.yaml -p nftcdn-preview up -d --build
```

## Advanced Usage

<details>
  <summary><b>TypeScript Client</b></summary>
  
We recommend to use `cardano-nftcdn-client`. Visit [cardano-nftcdn-client](https://github.com/xray-network/cardano-nftcdn-client) repo for more information.

</details>

<details>
  <summary><b>Using in Graph Cluster (Traefik Reverse Proxy)</b></summary>

1. Clone and run Traefik:
``` console
git clone https://github.com/xray-network/traefik-docker.git \
&& cd traefik-docker \
&& docker compose -up d
```

2. Set `BEARER_RESOLVER_TOKEN` and `docker-compose.kubo.xray.yaml`:
``` console
BEARER_RESOLVER_TOKEN=your_access_token \
docker compose -f docker-compose.kubo.xray.yaml up -d --build
```

3. Set `BEARER_RESOLVER_TOKEN` and `docker-compose.xray.yaml`:
``` console
NETWORK=mainnet \
BEARER_RESOLVER_TOKEN=your_access_token \
KOIOS_HOST=https://graph.xray.app/output/services/koios/mainnet/api/v1 \
docker compose -f docker-compose.xray.yaml -p nftcdn-mainnet up -d --build
```

</details>

## Documentation

* Rapidoc Playground (OpenAPI Schema) - https://graph.xray.app/output/services/nftcdn/mainnet/api/v1/
* OpenAPI Schema (JSON) - https://graph.xray.app/output/services/nftcdn/mainnet/api/v1/openapi.json
* TypeScript Client — https://github.com/xray-network/cardano-nftcdn-client
* Traefik — https://traefik.io/traefik


