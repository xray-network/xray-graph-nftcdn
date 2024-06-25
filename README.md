<a href="https://discord.gg/WhZmm46APN"><img alt="Discord" src="https://img.shields.io/discord/852538978946383893?style=for-the-badge&logo=discord&label=Discord&labelColor=%231940ED&color=%233FCB9B"></a>

# XRAY/Graph NFTCDN — Dockerized Metadata/Datums indexer with IPFS gateway

XRAY/Graph NFTCDN is a tool for fast and predictable deployment of Cardano Tokens Metadata/Datums Indexer ([Ogmios](https://ogmios.dev/)-based) & Image Resizer ([Sharp](https://sharp.pixelplumbing.com/)-based), IPFS Gateway ([Kubo](https://github.com/ipfs/kubo/)), and [Haproxy](https://www.haproxy.org/) (TCP/HTTP Load Balancer) stack in a docker environment. Used in the [XRAY/Graph](https://xray.app/) distributed Cardano API provider.

Indexes metadata from `CIP-0025` (Media Token Metadata: TX Label 721), `CIP-0026` (Cardano Token Registry), `CIP-0027` (Royalties: TX Label 777), `CIP-0060` (Music Token), `CIP-0068` (Datum Metadata). Proxies and caches (in case of resize) images received from IPFS, HTTP, Base64 (on-chain). Supports sending WebP if the client supports this format.

## Getting Started
### Prepare Installation

``` console
git clone \
  https://github.com/xray-network/xray-graph-nftcdn.git \
  && cd xray-graph-nftcdn
```
``` console
cp .env.example .env
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
* Ogmios — https://ogmios.dev/
* Haproxy — https://www.haproxy.org/

## Endpoints List
  
| Method  | Endpoint | Params | Description |
| --- | --- | --- | --- |
| GET  | /image/:fingerprint | | Proxy original image (IPFS, HTTP, Base64) from asset metadata in order `cip68->cip25->cip26` |
| GET  | /image/:fingerprint | ?select=cip25 | Specify from which metadata to load the image. Options: `cip25`, `cip26`, `cip68` |
| GET  | /image/:fingerprint | ?size=256 | Resize, cache, and serve image |
| GET  | /image/:fingerprint | ?size=256&crop=true |  Resize, crop (to square), cache, and serve image  |
| GET  | /metadata/:fingerprint | |  Serve asset metadata  |
| GET  | /metadata/:fingerprint | ?raw=true |  Don't replace image value with `SERVER_IMAGE_URL` prefix  |
| POST  | /metadata | {"fingerprints": string[], "raw": boolean } |  Bulk metadata retreiving (up to 1000)  |
| GET | /assets | | Get lits of assets with basic info |
| GET | /assets | ?fingerprint= &policy_id= &asset_name= &asset_name_ascii= &limit= &offset= | Search params, `asset_name_ascii` searches as `%LIKE%` in `utf8->hex` format |
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

<details>
  <summary>Postgres Config</summary>
  
* Config file (see end of file): [config/postgresql/postgresql.conf](config/postgresql/postgresql.conf)
* Docs: [https://www.postgresql.org/docs/current/index.html](https://www.postgresql.org/docs/current/index.html)
* Tune settings: [https://pgtune.leopard.in.ua](https://pgtune.leopard.in.ua)

</details>

## System Requirements
  
Since this instance uses Postgres as a database and works with cached images (resizing), the emphasis should be on a productive processor (the more cores, the better - sharp automatically divides the load by cores during resizing) and SSD disk:

* Any of the big well known Linux distributions (eg, Debian, Ubuntu, RHEL, CentOS, Arch etc).
* 64 Gigabytes of RAM or more.
* 4 CPU cores or more.
* Ensure that the machine has sufficient IOPS (Input/Output Operations per Second). Ie it should be 100k IOPS or better. Lower IOPS ratings will result in slower sync times and/or falling behind the chain tip.
* Minimum 1000 Gigabytes or more of SSD disk storage.
  
When building an application that will be querying the database, remember that for fast queries, low latency disk access is far more important than high throughput (assuming the minimal IOPS above is met).

