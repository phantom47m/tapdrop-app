import { pgTable, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * `drops` — one row per file someone uploads.
 * The short code (e.g. "T9F4K") is the row's primary lookup key.
 * File bytes themselves live on disk in /data (Railway volume), not in Postgres.
 */
export const drops = pgTable("drops", {
  /** Short code, base32-ish, e.g. "T9F4K". Recipient types this at tapdrop.app/g/<code>. */
  code: varchar("code", { length: 12 }).primaryKey(),

  /** Original filename, used in the download. */
  filename: text("filename").notNull(),

  /** MIME type the browser sent, used for Content-Type on download. */
  mimeType: text("mime_type").notNull(),

  /** File size in bytes. */
  size: integer("size").notNull(),

  /** Path on the Railway volume where the file is stored. e.g. "/data/abc123". */
  storagePath: text("storage_path").notNull(),

  /** Optional sender display name (free-form, no auth in v0.1). */
  senderName: text("sender_name"),

  /** Optional 4-digit PIN for the download page. NULL = no PIN. */
  pin: varchar("pin", { length: 16 }),

  /** When this drop expires. After this, downloads return 410 Gone. */
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  /** Hard cap on downloads. v0.1 default = 1. */
  maxDownloads: integer("max_downloads").notNull().default(1),

  /** Counter incremented on each successful download. */
  downloadCount: integer("download_count").notNull().default(0),

  /** Created at. */
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Drop = typeof drops.$inferSelect;
export type NewDrop = typeof drops.$inferInsert;
