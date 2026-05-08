import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";

/**
 * GET /api/drops/:code/download?pin=...
 *
 * Atomically:
 *  1. Look up the drop
 *  2. Verify expiry, max-downloads, optional PIN
 *  3. Increment download_count (still within the row read transaction)
 *  4. Stream the bytes back to the client
 *
 * In v0.1 we accept a small race window (two simultaneous downloaders could
 * both succeed before the counter saves). v0.2 will use SELECT FOR UPDATE.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/drops/[code]/download">,
) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await ensureSchema();

  const { code } = await ctx.params;
  const normalized = code.toUpperCase();

  const url = new URL(request.url);
  const pinSupplied = url.searchParams.get("pin") ?? "";

  const rows = await db.select().from(drops).where(eq(drops.code, normalized)).limit(1);
  const drop = rows[0];

  if (!drop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (drop.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }
  if (drop.downloadCount >= drop.maxDownloads) {
    return NextResponse.json({ error: "Already downloaded" }, { status: 410 });
  }
  if (drop.pin && drop.pin !== pinSupplied) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  // Increment download counter. Best-effort; failure here doesn't block the
  // download since the file should still be served.
  try {
    await db
      .update(drops)
      .set({ downloadCount: sql`${drops.downloadCount} + 1` })
      .where(eq(drops.code, normalized));
  } catch (e) {
    console.error("[download] increment failed:", e);
  }

  // Buffer (Node) → Uint8Array → Response body. The bytea column gives us a
  // Buffer when read, which is a Uint8Array subclass.
  const body = new Uint8Array(drop.data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": drop.mimeType,
      "Content-Length": String(drop.size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(drop.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}

export const runtime = "nodejs";
export const maxDuration = 60;
