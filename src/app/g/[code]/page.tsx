import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";
import RecipientScreen from "./recipient-screen";

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
