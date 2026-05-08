import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";
import RecipientScreen from "./recipient-screen";

/**
 * Per-drop metadata so iMessage/WhatsApp/Slack/etc. show a rich preview
 * with the sender's name + filename when the link is shared.
 *
 * The actual OG image lives at ./opengraph-image.tsx — Next.js wires it up
 * automatically via file convention.
 */
export async function generateMetadata(
  props: PageProps<"/g/[code]">,
): Promise<Metadata> {
  const { code } = await props.params;
  const normalized = code.toUpperCase();

  let title = `A file for you · TapDrop`;
  let description = "Tap to grab the file. No app needed.";

  if (db) {
    try {
      await ensureSchema();
      const rows = await db
        .select({ senderName: drops.senderName, filename: drops.filename })
        .from(drops)
        .where(eq(drops.code, normalized))
        .limit(1);
      const drop = rows[0];
      if (drop) {
        const sender = drop.senderName?.trim() || "Someone";
        title = `${sender} sent you ${drop.filename} · TapDrop`;
        description = `${sender} dropped a file for you via TapDrop. Tap to grab it — no app needed.`;
      }
    } catch {
      /* fall back to defaults */
    }
  }

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RecipientPage(
  props: PageProps<"/g/[code]">,
) {
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
      pin: drops.pin,
      expiresAt: drops.expiresAt,
      maxDownloads: drops.maxDownloads,
      downloadCount: drops.downloadCount,
    })
    .from(drops)
    .where(eq(drops.code, normalized))
    .limit(1);

  const drop = rows[0];

  // Three failure modes the recipient screen handles distinctly:
  const status: "ok" | "missing" | "expired" | "exhausted" = !drop
    ? "missing"
    : drop.expiresAt.getTime() < Date.now()
      ? "expired"
      : drop.downloadCount >= drop.maxDownloads
        ? "exhausted"
        : "ok";

  return (
    <RecipientScreen
      status={status}
      code={normalized}
      filename={drop?.filename ?? null}
      size={drop?.size ?? null}
      senderName={drop?.senderName ?? null}
      expiresAt={drop?.expiresAt.toISOString() ?? null}
      maxDownloads={drop?.maxDownloads ?? null}
      downloadCount={drop?.downloadCount ?? null}
      hasPin={Boolean(drop?.pin)}
    />
  );
}

export const dynamic = "force-dynamic";
