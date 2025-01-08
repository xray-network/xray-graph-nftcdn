<a href="https://discord.gg/WhZmm46APN"><img alt="Discord" src="https://img.shields.io/discord/852538978946383893?style=for-the-badge&logo=discord&label=Discord&labelColor=%231940ED&color=%233FCB9B"></a>

# XRAY/Graph NFTCDN — Dockerized Metadata/Datums indexer & Image Server with IPFS gateway

XRAY/Graph NFTCDN is a tool for caching Cardano token images & image resizer ([Sharp](https://sharp.pixelplumbing.com/)-based), IPFS Gateway ([Kubo](https://github.com/ipfs/kubo/)), with [Haproxy](https://www.haproxy.org/) (TCP/HTTP Load Balancer) in a docker environment. Used in the [XRAY/Graph](https://xray.app/) distributed Cardano API provider. Built on Koios API stack.

## Getting Started
### Prepare Installation

``` console
git clone \
  https://github.com/xray-network/xray-graph-nftcdn.git \
  && cd xray-graph-nftcdn
```
``` console
cp .env.haproxy.example .env.haproxy && \
cp .env.example .env.mainnet && \
cp .env.example .env.preprod && \
cp .env.example .env.preview
```
  
### Build and Run via Docker Compose

> You can combine profiles to run multiple networks on the same machine: `docker compose --profile mainnet --profile preprod --profile preview up -d`
  
<details open>
  <summary><b>MAINNET</b></summary>

``` console
docker compose --profile mainnet up -d
```

</details>
  
<details>
  <summary><b>PREPROD</b></summary>

``` console
docker compose --profile preprod up -d
```

</details>
  
<details>
  <summary><b>PREVIEW</b></summary>

``` console
docker compose --profile preview up -d
```

</details>

## Documentation

* NFTCDN — See Endpoints List below
* Kubo — https://github.com/ipfs/kubo/
* Haproxy — https://www.haproxy.org/

## Endpoints List

```
:id = Policy ID + Asset Name
```

| Method  | Endpoint | Params | Description |
| --- | --- | --- | --- |
| GET  | /image/:id | | Proxy original image (IPFS, HTTP, Base64) from asset metadata in order `cip68->cip25->cip26` |
| GET  | /image/:id | ?select=cip25 | Specify from which metadata to load the image. Options: `cip25`, `cip26`, `cip68` |
| GET  | /image/:id | ?size=256 | Resize, cache, and serve image |
| GET  | /image/:id | ?size=256&crop=true |  Resize, crop (to square), cache, and serve image  |
| GET  | /metadata/:id | |  Serve asset metadata  |
| POST  | /metadata | {"_asset_list": string[][] } |  Bulk metadata retreiving (up to 1000)  |
| GET | /ipfs/:cid |  | IPFS gateway proxy |

## Advanced Usage

<details>
  <summary>HAProxy Config</summary>
  
* Config file: [config/haproxy/haproxy.cfg](config/haproxy/haproxy.cfg)
* Docs: [https://www.haproxy.com/documentation/haproxy-configuration-manual/latest/](https://www.haproxy.com/documentation/haproxy-configuration-manual/latest/)

</details>

<details>
  <summary>Kubo Config</summary>
  
* Config file: [config/kubo/0001-init-config.sh](config/kubo/0001-init-config.sh)
* Docs: [https://docs.ipfs.tech/reference/kubo/cli/#ipfs-config](https://docs.ipfs.tech/reference/kubo/cli/#ipfs-config)

</details>

