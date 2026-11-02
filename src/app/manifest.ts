import type { MetadataRoute } from "next"

const BACKGROUND = "#000000"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "6AM",
    short_name: "6AM",
    start_url: "/",
    display: "fullscreen",
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    icons: [
      { src: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
