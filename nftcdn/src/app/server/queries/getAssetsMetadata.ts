import { sql, desc, asc, eq, ne, and } from "drizzle-orm"
import { db, schema } from "../../../db"

export const getAssetsMetadata = async (fingerprints: string[]) => {
  // Types: waiting drizzle to support LEFT JOIN LATERAL
  return (
    ((await db.execute(
      sql`
      SELECT
        a.fingerprint,
        a.ref_fingerprint,
        a.policy_id,
        a.asset_name,
        a.quantity,
        cip25.metadata as cip25,
        JSON_BUILD_OBJECT(
          'fingerprint', cip26.fingerprint,
          'policy_id', cip26.policy_id,
          'asset_name', cip26.asset_name,
          'subject', cip26.subject,
          'policy', cip26.policy,
          'name', cip26.name,
          'description', cip26.description,
          'ticker', cip26.ticker,
          'url', cip26.url,
          'logo', cip26.logo,
          'decimals', cip26.decimals
        ) as cip26,
        cip27.metadata as cip27,
        cip68.datum as cip68
      FROM asset a
      LEFT JOIN LATERAL (
        SELECT *
        FROM cip25_metadata
        WHERE fingerprint = a.fingerprint
        ORDER BY id DESC
        LIMIT 1
      ) cip25 ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM cip26_metadata
        WHERE fingerprint = a.fingerprint
        ORDER BY id DESC
        LIMIT 1
      ) cip26 ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM cip27_metadata
        WHERE fingerprint = a.fingerprint
        ORDER BY id DESC
        LIMIT 1
      ) cip27 ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM cip68_datum
        WHERE fingerprint = COALESCE(a.ref_fingerprint, a.fingerprint)
        ORDER BY id DESC
        LIMIT 1
      ) cip68 ON TRUE
      WHERE a.fingerprint IN ${fingerprints}
    `
    )) as {
      fingerprint: string
      policy_id: number
      asset_name: string | null
      ref_fingerprint: string | null
      quantity: string
      cip25: any
      cip26: {
        fingerprint: string
        policy_id: string
        asset_name: string | null
        subject: string
        policy: string | null
        name: string | null
        description: string | null
        ticker: string | null
        url: string | null
        logo: string | null
        decimals: number
      }
      cip27: any
      cip68: any
    }[]) || null
  )
}
