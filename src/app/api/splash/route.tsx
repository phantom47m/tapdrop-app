import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
// Per-request render so different ?w=&h= return different sizes. The
// long Cache-Control: immutable header on the response keeps CDN traffic
// cheap — each (w,h) pair is computed once and cached for a year.
export const dynamic = "force-dynamic";

/**
 * GET /api/splash?w=1290&h=2796
 *
 * Renders the iOS launch image (apple-touch-startup-image) for a given
 * device's native pixel dimensions. Each modern iPhone needs a splash
 * matching its exact resolution — we hand them this route with the right
 * w/h via media-queried <link> tags in layout.tsx.
 *
 * Composition is proportional to the canvas, so the same code yields a
 * pleasing layout from a 6.7" Pro Max down to a 4.7" SE.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const w = Math.max(320, Math.min(2048, Number(url.searchParams.get("w")) || 1290));
  const h = Math.max(320, Math.min(3000, Number(url.searchParams.get("h")) || 2796));

  const fontDir = path.join(process.cwd(), "public", "fonts");
  const [frauncesItalic, frauncesRegular, plexMono] = await Promise.all([
    readFile(path.join(fontDir, "Fraunces-Italic.ttf")),
    readFile(path.join(fontDir, "Fraunces-Regular.ttf")),
    readFile(path.join(fontDir, "IBMPlexMono-Medium.ttf")),
  ]);

  // Type scales relative to width — keeps the composition balanced on
  // both phone and tablet aspect ratios.
  const wordmarkSize = Math.round(w * 0.165);
  const dotSize = Math.round(w * 0.028);
  const taglineSize = Math.round(w * 0.05);
  const footerSize = Math.round(w * 0.022);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#EFE9DD",
          display: "flex",
          flexDirection: "column",
          padding: `${Math.round(h * 0.06)}px ${Math.round(w * 0.08)}px`,
          fontFamily: "Fraunces",
          color: "#11110F",
        }}
      >
        {/* Top spacer */}
        <div style={{ flex: 1 }} />

        {/* Center stack: wordmark + tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.round(h * 0.02),
          }}
        >
          {/* Italic 'Tap • Drop' wordmark, scaled to width */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: wordmarkSize,
              letterSpacing: "-0.025em",
              lineHeight: 1,
            }}
          >
            <span>Tap</span>
            <span
              style={{
                width: dotSize,
                height: dotSize,
                background: "#D63F1B",
                borderRadius: "50%",
                margin: `0 ${Math.round(dotSize * 0.5)}px ${Math.round(
                  wordmarkSize * 0.18,
                )}px`,
                alignSelf: "center",
                display: "flex",
              }}
            />
            <span>Drop</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              gap: Math.round(taglineSize * 0.22),
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: taglineSize,
              color: "#2A2A26",
              letterSpacing: "-0.015em",
              marginTop: Math.round(h * 0.012),
            }}
          >
            <span>Tap.</span>
            <span>Drop.</span>
            <span style={{ color: "#D63F1B" }}>Done.</span>
          </div>
        </div>

        {/* Bottom spacer + footer */}
        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: Math.round(w * 0.02),
            fontFamily: "PlexMono",
            fontSize: footerSize,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6E6A60",
          }}
        >
          <span
            style={{
              width: Math.round(w * 0.04),
              height: 1,
              background: "#6E6A60",
              display: "flex",
            }}
          />
          <span>47 Industries × iUSEJOE</span>
          <span
            style={{
              width: Math.round(w * 0.04),
              height: 1,
              background: "#6E6A60",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    {
      width: w,
      height: h,
      // Long cache — splash for a given size never changes between deploys.
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      fonts: [
        { name: "Fraunces", data: frauncesItalic, weight: 400, style: "italic" },
        { name: "Fraunces", data: frauncesRegular, weight: 400, style: "normal" },
        { name: "PlexMono", data: plexMono, weight: 500, style: "normal" },
      ],
    },
  );
}
