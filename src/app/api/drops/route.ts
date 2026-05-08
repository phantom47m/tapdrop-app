import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { generateShortCode } from "@/lib/code";

/** Absolute upload cap for v0.1. Mirrors the homepage copy. */
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/drops
 *
 * Multipart form fields:
 *   file        — the file (required)
 *   senderName  — optional display name shown to recipient
 *   pin         — optional PIN
 *   expiryHours — optional, defaults to 24
 *
 * Returns: { code, expiresAt }
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    await ensureSchema();
  } catch (e) {
    console.error("[/api/drops] schema init failed:", e);
    return NextResponse.json(
      { error: "Database init failed" },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
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

  const expiryHours = Math.max(
    1,
    Math.min(168, Number(expiryHoursRaw) || 24),
  );

  // Read the file into a Buffer.
  const buf = Buffer.from(await file.arrayBuffer());

  // Generate a unique short code (collisions extremely unlikely at 5 chars,
  // but we retry up to 3 times just in case).
  let code = generateShortCode();
  let attempts = 0;
  while (attempts < 3) {
    try {
      await db.insert(drops).values({
        code,
        filename: file.name || "file",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data: buf,
        senderName,
        pin,
        expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
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
      return NextResponse.json(
        { error: "Could not store drop" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    code,
    expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
  });
}

// Allow uploads up to MAX_BYTES — Next.js by default limits body size for
// route handlers. Setting a higher runtime ceiling here.
export const runtime = "nodejs";
export const maxDuration = 60;
