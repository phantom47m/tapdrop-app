import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres connection. DATABASE_URL is provided by Railway when the
 * Postgres plugin is attached to the service.
 *
 * The `connection()` helper from "next/server" should be called in pages
 * that read process.env at runtime (Next 16 requirement) — this module is
 * imported only from server components / route handlers, so direct access
 * is fine, but each page that reads env should `await connection()` first.
 */
const connectionString = process.env.DATABASE_URL ?? "";

if (!connectionString && process.env.NODE_ENV !== "development") {
  // Don't throw at import time in dev — let pages render the placeholder.
  console.warn("[db] DATABASE_URL is not set");
}

const client = connectionString
  ? postgres(connectionString, { prepare: false })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
export { schema };
