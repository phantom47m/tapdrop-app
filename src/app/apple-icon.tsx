import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/** Apple touch icon — what shows up on iOS home screen when you "Add to Home Screen". */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fraunces = await readFile(
    path.join(process.cwd(), "public", "fonts", "Fraunces-Italic.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#11110F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontFamily: "Fraunces",
        }}
      >
        <span
          style={{
            fontSize: 130,
            fontStyle: "italic",
            fontWeight: 400,
            color: "#EFE9DD",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            paddingBottom: 12,
          }}
        >
          t
        </span>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#D63F1B",
            display: "flex",
            alignSelf: "center",
            marginTop: 28,
          }}
        />
        <span
          style={{
            fontSize: 130,
            fontStyle: "italic",
            fontWeight: 400,
            color: "#EFE9DD",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            paddingBottom: 12,
          }}
        >
          d
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "italic" },
      ],
    },
  );
}
