import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { drops } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";

export const runtime = "nodejs";
export const alt = "A file is waiting for you on TapDrop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { readFile } from "node:fs/promises";
import path from "node:path";

async function loadFonts() {
  const fontDir = path.join(process.cwd(), "public", "fonts");
  const [fraunces, frauncesItalic, plexMono, plexSans] = await Promise.all([
    readFile(path.join(fontDir, "Fraunces-Regular.ttf")),
    readFile(path.join(fontDir, "Fraunces-Italic.ttf")),
    readFile(path.join(fontDir, "IBMPlexMono-Medium.ttf")),
    readFile(path.join(fontDir, "IBMPlexSans-Medium.ttf")),
  ]);
  return { fraunces, frauncesItalic, plexMono, plexSans };
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "FILE";
  return name.slice(dot + 1).slice(0, 4).toUpperCase();
}

function senderInitial(name: string | null): string {
  if (!name) return "·";
  const t = name.trim();
  return t ? t[0].toUpperCase() : "·";
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
}

export default async function DropOG(
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const normalized = code.toUpperCase();

  let senderName: string | null = null;
  let filename = "A file";
  let size_bytes = 0;
  let exists = false;

  if (db) {
    try {
      await ensureSchema();
      const rows = await db
        .select({
          filename: drops.filename,
          size: drops.size,
          senderName: drops.senderName,
        })
        .from(drops)
        .where(eq(drops.code, normalized))
        .limit(1);
      if (rows[0]) {
        exists = true;
        senderName = rows[0].senderName;
        filename = rows[0].filename;
        size_bytes = rows[0].size;
      }
    } catch {
      // fall through to "no drop" rendering
    }
  }

  const { fraunces, frauncesItalic, plexMono, plexSans } = await loadFonts();
  const sender = senderName ?? "Someone";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#EFE9DD",
          display: "flex",
          flexDirection: "column",
          padding: "60px 80px",
          color: "#11110F",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 28,
            borderBottom: "1px solid #D8CFBC",
          }}
        >
          <span
            style={{
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontSize: 36,
              letterSpacing: "-0.025em",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            Tap
            <span
              style={{
                width: 7,
                height: 7,
                background: "#D63F1B",
                borderRadius: "50%",
                margin: "0 5px 7px",
              }}
            />
            Drop
          </span>
          <span
            style={{
              fontFamily: "PlexMono",
              fontSize: 16,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#6E6A60",
            }}
          >
            /g/{normalized}
          </span>
        </div>

        {/* Sender + headline */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 32,
            paddingTop: 12,
          }}
        >
          {exists ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#11110F",
                    color: "#EFE9DD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Fraunces",
                    fontStyle: "italic",
                    fontSize: 30,
                  }}
                >
                  {senderInitial(senderName)}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: "PlexMono",
                      fontSize: 14,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#6E6A60",
                    }}
                  >
                    Sent by
                  </span>
                  <span
                    style={{
                      fontFamily: "PlexSans",
                      fontSize: 30,
                      fontWeight: 500,
                      marginTop: 4,
                    }}
                  >
                    {sender}
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontFamily: "Fraunces",
                  fontSize: 96,
                  fontWeight: 400,
                  lineHeight: 0.98,
                  letterSpacing: "-0.025em",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span>One file,</span>
                <span style={{ fontStyle: "italic", color: "#D63F1B" }}>
                  one tap away.
                </span>
              </div>

              {/* File card */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #D8CFBC",
                  borderRadius: 18,
                  padding: 22,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  maxWidth: 760,
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 84,
                    background: "#FBFAF7",
                    border: "1px solid #D8CFBC",
                    borderRadius: 6,
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "PlexMono",
                      fontSize: 14,
                      letterSpacing: "0.08em",
                      color: "#D63F1B",
                      fontWeight: 600,
                      paddingBottom: 8,
                    }}
                  >
                    {fileExt(filename)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "PlexSans",
                      fontSize: 26,
                      fontWeight: 500,
                      color: "#11110F",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 600,
                    }}
                  >
                    {filename}
                  </span>
                  <span
                    style={{
                      fontFamily: "PlexMono",
                      fontSize: 14,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#6E6A60",
                      marginTop: 6,
                    }}
                  >
                    {fileExt(filename)} · {formatBytes(size_bytes)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                fontFamily: "Fraunces",
                fontSize: 110,
                fontWeight: 400,
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>No drop</span>
              <span style={{ fontStyle: "italic", color: "#D63F1B" }}>
                here.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 22,
            borderTop: "1px solid #D8CFBC",
            fontFamily: "PlexMono",
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6E6A60",
          }}
        >
          <span>Tap. Drop. Done.</span>
          <span>No app needed</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "Fraunces", data: frauncesItalic, weight: 400, style: "italic" },
        { name: "PlexMono", data: plexMono, weight: 500, style: "normal" },
        { name: "PlexSans", data: plexSans, weight: 500, style: "normal" },
      ],
    },
  );
}
