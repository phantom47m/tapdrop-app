import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";

/**
 * GET /api/drops/:code/status
 *
 * Polled by the sender's /sent/[code] page every few seconds to flip the UI
 * from "Waiting…" to "Delivered ✓" the moment the recipient downloads.
 *
 * Returns the same lightweight shape regardless of state — UI decides what
 * to do with it.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/drops/[code]/status">,
) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await ensureSchema();

  const { code } = await ctx.params;
  const normalized = code.toUpperCase();

  const rows = await db
    .select({
      downloadCount: drops.downloadCount,
      maxDownloads: drops.maxDownloads,
      expiresAt: drops.expiresAt,
    })
    .from(drops)
    .where(eq(drops.code, normalized))
    .limit(1);

  const drop = rows[0];
  if (!drop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expired = drop.expiresAt.getTime() < Date.now();
  const exhausted = drop.downloadCount >= drop.maxDownloads;

  return NextResponse.json(
    {
      downloadCount: drop.downloadCount,
      maxDownloads: drop.maxDownloads,
      expiresAt: drop.expiresAt.toISOString(),
      delivered: drop.downloadCount > 0,
      expired,
      exhausted,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const runtime = "nodejs";
