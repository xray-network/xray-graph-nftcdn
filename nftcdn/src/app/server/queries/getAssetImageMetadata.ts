import { sql, desc, asc, eq, ne, and } from "drizzle-orm"
import { db, schema } from "../../../db"

export const getAssetImageMetadata = async (fingerprint: string) => {
  // Types: waiting drizzle to support LEFT JOIN LATERAL
  return (
    ((
      await db.execute(
        sql`
      SELECT
        a.fingerprint,
        a.ref_fingerprint,
        cip25.metadata as cip25,
        JSON_BUILD_OBJECT(
          'fingerprint', cip26.fingerprint,
          'logo', cip26.logo
        ) as cip26,
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
        FROM cip68_datum
        WHERE fingerprint = COALESCE(a.ref_fingerprint, a.fingerprint)
        ORDER BY id DESC
        LIMIT 1
      ) cip68 ON TRUE
      WHERE a.fingerprint = ${fingerprint}
    `
      )
    )[0] as {
      fingerprint: string
      ref_fingerprint: string | null
      cip25: any
      cip26: {
        fingerprint: string
        logo: string | null
      }
      cip68: any
    }) || null
  )
}
