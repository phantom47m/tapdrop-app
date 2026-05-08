import type { MetadataRoute } from "next";

/**
 * PWA manifest — referenced automatically by Next.js when present at
 * app/manifest.ts. Drives the "Add to Home Screen" experience on Android
 * (iOS uses apple-icon + apple-mobile-web-app-* meta tags instead).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TapDrop",
    short_name: "TapDrop",
    description:
      "Drop a file. Show your screen. They tap it. No app on the recipient's phone.",
    start_url: "/",
    display: "standalone",
    background_color: "#EFE9DD",
    theme_color: "#11110F",
    orientation: "portrait",
    icons: [
      // Next auto-renders apple-icon at 180x180 — reuse it for Android too.
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
