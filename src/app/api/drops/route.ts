import { NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { generateShortCode } from "@/lib/code";

/** Absolute upload cap for v0.1 (sum of all files when zipped). */
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/drops
 *
 * Multipart form fields:
 *   file         — the file (required, repeatable for multi-file)
 *   senderName   — optional display name shown to recipient
 *   pin          — optional PIN
 *   expiryHours  — optional, defaults to 24
 *
 * Multiple `file` entries get zipped server-side into one archive named
 * `drop-CODE.zip`. Single-file uploads pass through unchanged.
 *
 * Returns: { code, expiresAt, multi, fileCount }
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await ensureSchema();
  } catch (e) {
    console.error("[/api/drops] schema init failed:", e);
    return NextResponse.json({ error: "Database init failed" }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const incoming = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (incoming.length === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const totalSize = incoming.reduce((acc, f) => acc + f.size, 0);
  if (totalSize > MAX_BYTES) {
    return NextResponse.json(
      { error: `Total too large. Max ${MAX_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
  }

  // Single → pass through. Multi → zip.
  let storedFilename: string;
  let storedMime: string;
  let storedBuf: Buffer;
  let storedSize: number;
  const isMulti = incoming.length > 1;

  if (isMulti) {
    const zip = new JSZip();
    for (const f of incoming) {
      const ab = await f.arrayBuffer();
      // Avoid filename collisions: prepend an ordinal if needed.
      let name = f.name || "file";
      let i = 1;
      while (zip.file(name)) {
        name = `${i}-${f.name || "file"}`;
        i++;
      }
      zip.file(name, ab);
    }
    storedBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    storedSize = storedBuf.length;
    storedMime = "application/zip";
    // Filename includes a placeholder for the code; we'll patch it after generation.
    storedFilename = `__CODE__.zip`;
  } else {
    const f = incoming[0];
    storedBuf = Buffer.from(await f.arrayBuffer());
    storedSize = f.size;
    storedMime = f.type || "application/octet-stream";
    storedFilename = f.name || "file";
  }

  const senderNameRaw = form.get("senderName");
  const pinRaw = form.get("pin");
  const expiryHoursRaw = form.get("expiryHours");

  const senderName =
    typeof senderNameRaw === "string" && senderNameRaw.trim()
      ? senderNameRaw.trim().slice(0, 80)
      : null;

  const pin =
    typeof pinRaw === "string" && /^\d{3,8}$/.test(pinRaw.trim())
      ? pinRaw.trim()
      : null;

  const expiryHours = Math.max(1, Math.min(168, Number(expiryHoursRaw) || 24));
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  let code = generateShortCode();
  let attempts = 0;
  while (attempts < 3) {
    try {
      const finalFilename = isMulti
        ? `tapdrop-${code}.zip`
        : storedFilename;

      await db.insert(drops).values({
        code,
        filename: finalFilename,
        mimeType: storedMime,
        size: storedSize,
        data: storedBuf,
        senderName,
        pin,
        expiresAt,
        maxDownloads: 1,
      });
      break;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate key") && attempts < 2) {
        code = generateShortCode();
        attempts++;
        continue;
      }
      console.error("[/api/drops] insert failed:", e);
      return NextResponse.json({ error: "Could not store drop" }, { status: 500 });
    }
  }

  return NextResponse.json({
    code,
    expiresAt: expiresAt.toISOString(),
    multi: isMulti,
    fileCount: incoming.length,
  });
}

export const runtime = "nodejs";
export const maxDuration = 60;
