import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "TapDrop — drop a file, show your screen, they tap it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { readFile } from "node:fs/promises";
import path from "node:path";

async function loadFonts() {
  const fontDir = path.join(process.cwd(), "public", "fonts");
  const [fraunces, frauncesItalic, plexMono] = await Promise.all([
    readFile(path.join(fontDir, "Fraunces-Regular.ttf")),
    readFile(path.join(fontDir, "Fraunces-Italic.ttf")),
    readFile(path.join(fontDir, "IBMPlexMono-Medium.ttf")),
  ]);
  return { fraunces, frauncesItalic, plexMono };
}

export default async function OG() {
  const { fraunces, frauncesItalic, plexMono } = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#EFE9DD",
          display: "flex",
          flexDirection: "column",
          padding: "70px 90px",
          fontFamily: "Fraunces, serif",
          color: "#11110F",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 30,
            borderBottom: "1px solid #D8CFBC",
          }}
        >
          <span
            style={{
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontSize: 44,
              letterSpacing: "-0.025em",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            Tap
            <span
              style={{
                width: 9,
                height: 9,
                background: "#D63F1B",
                borderRadius: "50%",
                margin: "0 6px 8px",
              }}
            />
            Drop
          </span>
          <span
            style={{
              fontFamily: "PlexMono",
              fontSize: 16,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#6E6A60",
            }}
          >
            47 Industries × iUSEJOE
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 30,
          }}
        >
          <div
            style={{
              fontFamily: "PlexMono",
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#6E6A60",
              marginBottom: 32,
            }}
          >
            — Drop a file. Show your screen. —
          </div>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: 132,
              fontWeight: 400,
              lineHeight: 0.96,
              letterSpacing: "-0.025em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>They tap</span>
            <span style={{ fontStyle: "italic", color: "#D63F1B" }}>it.</span>
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid #D8CFBC",
            fontFamily: "PlexMono",
            fontSize: 16,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6E6A60",
          }}
        >
          <span>No app on either side</span>
          <span>tapdrop.app</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "Fraunces", data: frauncesItalic, weight: 400, style: "italic" },
        { name: "PlexMono", data: plexMono, weight: 500, style: "normal" },
      ],
    },
  );
}
