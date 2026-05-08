import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_HOST =
  process.env.NEXT_PUBLIC_APP_HOST ||
  "tapdrop-app-production.up.railway.app";
const APP_URL = `https://${APP_HOST}`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "TapDrop — drop a file, show your screen, they tap it",
  description:
    "Send any file to any phone with a tap. No app on the recipient's phone, ever. iPhone or Android.",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "TapDrop",
    title: "TapDrop — drop a file, show your screen, they tap it",
    description:
      "Send any file to any phone with a tap. No app on the recipient's phone, ever.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TapDrop — drop a file, show your screen, they tap it",
    description:
      "Send any file to any phone with a tap. No app on the recipient's phone, ever.",
  },
  appleWebApp: {
    title: "TapDrop",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#EFE9DD",
  width: "device-width",
  initialScale: 1,
};

/**
 * iPhone splash dimensions (CSS device-width × device-height) → native pixel
 * resolution iOS expects for `apple-touch-startup-image`. iOS will only show
 * the splash if BOTH the media query matches AND the image is the exact
 * native resolution. We cover the ~5 phone families representing 95%+ of
 * iPhone users today; older phones simply skip the splash and load the page.
 */
const IPHONE_SPLASHES: Array<{
  /** CSS device-width in pt */
  dw: number;
  /** CSS device-height in pt */
  dh: number;
  /** devicePixelRatio (almost always 3 on Pro models, 2 on standard) */
  pr: number;
  /** Native splash image width in px (= dw * pr) */
  w: number;
  /** Native splash image height in px (= dh * pr) */
  h: number;
}> = [
  // iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max
  { dw: 430, dh: 932, pr: 3, w: 1290, h: 2796 },
  // iPhone 14 Plus / 14 Pro Max (older Plus & XS Max)
  { dw: 428, dh: 926, pr: 3, w: 1284, h: 2778 },
  // iPhone 14 Pro / 15 Pro / 16 Pro
  { dw: 393, dh: 852, pr: 3, w: 1179, h: 2556 },
  // iPhone 14 / 13 / 12 / 12 Pro
  { dw: 390, dh: 844, pr: 3, w: 1170, h: 2532 },
  // iPhone X / XS / 11 Pro / 13 Mini / 12 Mini
  { dw: 375, dh: 812, pr: 3, w: 1125, h: 2436 },
  // iPhone XR / 11
  { dw: 414, dh: 896, pr: 2, w: 828, h: 1792 },
  // iPhone 8 / SE 2nd-3rd gen
  { dw: 375, dh: 667, pr: 2, w: 750, h: 1334 },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {IPHONE_SPLASHES.map(({ dw, dh, pr, w, h }) => (
          <link
            key={`${w}x${h}`}
            rel="apple-touch-startup-image"
            href={`/api/splash?w=${w}&h=${h}`}
            media={`(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${pr}) and (orientation: portrait)`}
          />
        ))}
      </head>
      <body className="relative min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
