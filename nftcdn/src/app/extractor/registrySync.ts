import simpleGit from "simple-git"
import fs from "fs"
import { and, eq, sql } from "drizzle-orm"
import { db, schema } from "../../db"
import { logger, generateFingerprint } from "../../utils"
import { NETWORK } from "../../config/vars"

export const GIT_REGISTRY_FOLDER = "./tmp/cardano-token-registry"
export const GIT_MAPPINGS_FOLDER = NETWORK === "mainnet" ? "mappings" : "registry"
export const GIT_REGISTRY_REPOSITORY_URL =
  NETWORK === "mainnet"
    ? "https://github.com/cardano-foundation/cardano-token-registry.git"
    : "https://github.com/input-output-hk/metadata-registry-testnet.git"
!fs.existsSync(GIT_REGISTRY_FOLDER) && fs.mkdirSync(GIT_REGISTRY_FOLDER, { recursive: true })

export const registrySync = async () => {
  const git = simpleGit(GIT_REGISTRY_FOLDER)
  if (fs.existsSync(`${GIT_REGISTRY_FOLDER}/.git`)) {
    try {
      const { files } = await git.pull()
      const filesToProcess: string[] = []
      const filesToDelete: string[] = []
      files.forEach((file) => {
        if (file.startsWith("mappings/")) {
          const fileName = file.replace(`mappings/`, "")
          fs.existsSync(`${GIT_REGISTRY_FOLDER}/${GIT_MAPPINGS_FOLDER}/${fileName}`)
            ? filesToProcess.push(fileName)
            : filesToDelete.push(fileName)
        }
      })
      await processFiles(filesToProcess)
      await deleteFiles(filesToDelete)
      logger(`Registry Pull :: Success :: Processed ${filesToProcess.length} :: Deleted ${filesToDelete.length}`)
    } catch (error) {
      logger(`Registry Pull :: Error :: ${JSON.stringify(error)}`)
    }
  } else {
    try {
      await git.clone(GIT_REGISTRY_REPOSITORY_URL, ".")
      const filesToProcess = [
        ...new Set(
          fs
            .readdirSync(`${GIT_REGISTRY_FOLDER}/${GIT_MAPPINGS_FOLDER}`)
            .filter((file) => file.endsWith(".json"))
            .map((file) => file.toLowerCase())
        ),
      ]
      await processFiles(filesToProcess)
      logger(`Registry Clone :: Success :: Processed ${filesToProcess.length}`)
    } catch (error) {
      logger(`Registry Clone :: Error :: ${JSON.stringify(error)}`)
    }
  }
}

const getFilesContentInJSON = (files: string[]) => {
  return files
    .map((file) => {
      try {
        return JSON.parse(fs.readFileSync(`${GIT_REGISTRY_FOLDER}/${GIT_MAPPINGS_FOLDER}/${file}`, "utf-8"))
      } catch (error) {
        return {}
      }
    })
    .filter((file) => file.subject)
}

const processFiles = async (files: string[]) => {
  const assetsRaw = getFilesContentInJSON(files)
  const seen = new Set()
  const assets = assetsRaw
    .map((asset) => {
      const policy_id = asset?.subject.slice(0, 56) as string
      const asset_name = asset?.subject.slice(56) as string
      const fingerprint = generateFingerprint(policy_id, asset_name) as string
      return {
        fingerprint,
        policy_id,
        asset_name,
        subject: asset?.subject,
        policy: asset?.policy,
        name: asset?.name?.value,
        description: asset?.description?.value,
        ticker: asset?.ticker?.value,
        url: asset?.url?.value,
        logo: asset?.logo?.value,
        decimals: asset?.decimals?.value || 0,
      }
    })
    .filter(({ fingerprint }) => {
      if (seen.has(fingerprint)) {
        return false
      } else {
        seen.add(fingerprint)
        return true
      }
    })

  if (assets.length) {
    await db
      .insert(schema.cip26_metadata)
      .values(assets)
      .onConflictDoUpdate({
        target: [schema.cip26_metadata.fingerprint],
        set: {
          policy_id: sql`excluded.policy_id`,
          asset_name: sql`excluded.asset_name`,
          subject: sql`excluded.subject`,
          policy: sql`excluded.policy`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          ticker: sql`excluded.ticker`,
          url: sql`excluded.url`,
          logo: sql`excluded.logo`,
          decimals: sql`excluded.decimals`,
        },
      })
  }
}

const deleteFiles = async (files: string[]) => {
  const filesToRemove: string[] = []
  for (const file of files) {
    const policy_id = file.slice(0, 56)
    const asset_name = file.slice(56)
    const fingerprint = generateFingerprint(policy_id, asset_name) as string
    filesToRemove.push(fingerprint)
  }
  await db.transaction(async (tx) => {
    for (const file of filesToRemove) {
      await tx.delete(schema.cip26_metadata).where(eq(schema.cip26_metadata.fingerprint, file))
    }
  })
}
