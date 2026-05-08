import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";
import SentScreen from "./sent-screen";

export default async function SentPage(
  props: PageProps<"/sent/[code]">,
) {
  // Per Next 16 — read env at request time, not build time.
  await connection();

  const { code } = await props.params;
  const normalized = code.toUpperCase();

  if (!db) notFound();
  await ensureSchema();

  const rows = await db
    .select({
      code: drops.code,
      filename: drops.filename,
      size: drops.size,
      mimeType: drops.mimeType,
      senderName: drops.senderName,
      expiresAt: drops.expiresAt,
      maxDownloads: drops.maxDownloads,
      downloadCount: drops.downloadCount,
    })
    .from(drops)
    .where(eq(drops.code, normalized))
    .limit(1);

  const drop = rows[0];
  if (!drop) notFound();

  // Build the absolute recipient URL the QR encodes.
  const proto = "https";
  const host =
    process.env.NEXT_PUBLIC_APP_HOST ||
    process.env.RAILWAY_SERVICE_TAPDROP_APP_URL ||
    "tapdrop-app-production.up.railway.app";
  const recipientUrl = `${proto}://${host}/g/${drop.code}`;

  return (
    <SentScreen
      code={drop.code}
      filename={drop.filename}
      size={drop.size}
      senderName={drop.senderName}
      expiresAt={drop.expiresAt.toISOString()}
      recipientUrl={recipientUrl}
    />
  );
}
