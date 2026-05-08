import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Creates the `drops` table if it doesn't exist. Cheaper than running a full
 * migration tool for v0.1 — the schema is one table. Called lazily on first
 * request and cached in module scope.
 */
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (ready) return ready;
  if (!db) return Promise.reject(new Error("DATABASE_URL not configured"));

  ready = (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drops (
        code           VARCHAR(12)              PRIMARY KEY,
        filename       TEXT                     NOT NULL,
        mime_type      TEXT                     NOT NULL,
        size           INTEGER                  NOT NULL,
        data           BYTEA                    NOT NULL,
        sender_name    TEXT,
        pin            VARCHAR(16),
        expires_at     TIMESTAMPTZ              NOT NULL,
        max_downloads  INTEGER                  NOT NULL DEFAULT 1,
        download_count INTEGER                  NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ              NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS drops_expires_idx ON drops (expires_at)
    `);
  })();

  // If init fails, allow next call to retry.
  ready.catch(() => { ready = null; });
  return ready;
}
