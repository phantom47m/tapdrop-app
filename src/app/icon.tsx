import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/** Browser tab favicon — at 32x32 the wordmark is unreadable, so just the
 * orange dot on ink. Reads as a single confident punctuation mark. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#D63F1B",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
