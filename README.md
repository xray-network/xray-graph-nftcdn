<a href="https://discord.gg/WhZmm46APN"><img alt="Discord" src="https://img.shields.io/discord/852538978946383893?style=for-the-badge&logo=discord&label=Discord&labelColor=%231940ED&color=%233FCB9B"></a>

# XRAY | Graph | NFTCDN — Cardano Tokens Metadata Explorer & Images CDN

> [!NOTE]
> XRAY | Graph | NFTCDN is a dockered Cardano native tokenes metadata/datums indexer/explorer API tool and images CDN with IPFS gateway, based on [Ogmios](https://ogmios.dev/) and [Kubo](https://github.com/ipfs/kubo).
> Indexes metadata from `CIP25` (Media Token Metadata: TX Label 721), `CIP26` (Cardano Token Registry), `CIP27` (Royalties: TX Label 777), `CIP60` (Music Token), `CIP68` (Datum Metadata). Proxies and caches (in case of resize) images received from IPFS, HTTP, Base64 (on-chain). Supports sending WebP if the client supports this format. Useue [Sharp](https://sharp.pixelplumbing.com/) for image processing.

## Getting Started

``` console
git clone \
  https://github.com/xray-network/xray-graph-nftcdn.git \
  && xray-graph-nftcdn
```
``` console
cp .env.example .env
```
  
### Build and Run via Docker Compose (with Ogmios Cardano Node and Kubo)
  
<details open>
  <summary><b>MAINNET</b></summary>

Default

``` console
docker compose -p nftcdn-mainnet up -d --build
```
With HAProxy

``` console
docker compose --profile haproxy -p nftcdn-mainnet up -d --build
```

</details>
  
<details>
  <summary><b>PREPROD</b></summary>

Default

``` console
NETWORK=preprod docker compose -p nftcdn-preprod up -d --build
```

With HAProxy

``` console
NETWORK=preprod docker compose --profile haproxy -p nftcdn-preprod up -d --build
```

Advanced usage (ports mapping, in case you are using multiple instances on the same server)

``` console
NETWORK=preprod \
CARDANO_NODE_PORT=3001 \
POSTGRES_PORT=5433 \
OGMIOS_PORT=1338 \
KUBO_PORT=1883 \
NFTCDN_SERVER_PORT=4701 \
docker compose -p preprod -p nftcdn-preprod up -d --build
```

</details>
  
<details>
  <summary><b>PREVIEW</b></summary>

Default

``` console
NETWORK=preview docker compose -p nftcdn-preview up -d --build
```

With HAProxy

``` console
NETWORK=preview docker compose -p nftcdn-preview --profile haproxy up -d --build
```

Advanced usage (ports mapping, in case you are using multiple instances on the same server)

``` console
NETWORK=preview \
CARDANO_NODE_PORT=3002 \
POSTGRES_PORT=5434 \
OGMIOS_PORT=1339 \
KUBO_PORT=1884 \
NFTCDN_SERVER_PORT=4702 \
docker compose -p preview -p nftcdn-preview up -d --build
```

</details>


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
  <summary>External Ogmios Cardano Node and Kubo</summary>

You can pass `OGMIOS_HOST` and `KUBO_HOST` in case these instances are hosted on different servers.
  
<details open>
  <summary><b>MAINNET</b></summary>

Default

``` console
OGMIOS_PORT=1337 \
KUBO_PORT=1882 \
docker compose -f docker-compose.external.yml -p nftcdn-mainnet up -d --build
```
With HAProxy

``` console
OGMIOS_PORT=1337 \
KUBO_PORT=1882 \
docker compose -f docker-compose.external.yml --profile haproxy -p nftcdn-mainnet up -d --build
```

</details>
  
<details>
  <summary><b>PREPROD</b></summary>

Default

``` console
NETWORK=preprod \
POSTGRES_PORT=5553
OGMIOS_PORT=1338 \
KUBO_PORT=1882 \
NFTCDN_SERVER_PORT=4701 \
docker compose -f docker-compose.external.yml -p nftcdn-preprod up -d --build
```

With HAProxy

``` console
NETWORK=preprod \
POSTGRES_PORT=5553
OGMIOS_PORT=1338 \
KUBO_PORT=1882 \
NFTCDN_SERVER_PORT=4701 \
docker compose -f docker-compose.external.yml --profile haproxy -p nftcdn-preprod up -d --build
```

Advanced usage (ports mapping, in case you are using multiple instances on the same server)

``` console
NETWORK=preprod \
POSTGRES_PORT=5553
OGMIOS_PORT=1338 \
KUBO_PORT=1882 \
NFTCDN_SERVER_PORT=4701 \
docker compose -f docker-compose.external.yml -p preprod -p nftcdn-preprod up -d --build
```

</details>
  
<details>
  <summary><b>PREVIEW</b></summary>

Default

``` console
NETWORK=preview \
POSTGRES_PORT=5534
OGMIOS_PORT=1339 \
KUBO_PORT=1882 \
NFTCDN_SERVER_PORT=4702 \
docker compose -f docker-compose.external.yml -p nftcdn-preview up -d --build
```

With HAProxy

``` console
NETWORK=preview \
POSTGRES_PORT=5534
OGMIOS_PORT=1339 \
KUBO_PORT=1882 \
NFTCDN_SERVER_PORT=4702 \
docker compose -f docker-compose.external.yml -p nftcdn-preview --profile haproxy up -d --build
```

Advanced usage (ports mapping, in case you are using multiple instances on the same server)

``` console
NETWORK=preview \
POSTGRES_PORT=5534
OGMIOS_PORT=1339 \
KUBO_PORT=1882 \
NFTCDN_SERVER_PORT=4702 \
docker compose -f docker-compose.external.yml -p preview -p nftcdn-preview up -d --build
```

</details>

</details>

<details>
  <summary>Env Variables</summary>
  
* `POSTGRES_PASSWORD=your_secret_password` change it from default
* `MAX_IMAGE_SIZE=2048` maximum image size in case of caching (`?size=256` query string)
* `SERVER_IMAGE_URL=` prefix in image URLs from metadata, default `https://graph.xray.app/output/nftcdn/${NETWORK}/api/v1`
* `OUTPUT_AUTH_TOKEN=` token to access the paid version of XRAY | Graph | Output | Ogmios (WebSocket)

</details>

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

