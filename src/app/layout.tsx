import type { Metadata } from "next"
import {
  Cinzel_Decorative,
  Noto_Naskh_Arabic,
  Noto_Serif_JP,
  Noto_Serif_SC,
  Sahitya,
} from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-cinzel-decorative",
})

const sahitya = Sahitya({
  weight: ["400", "700"],
  subsets: ["devanagari"],
  preload: false,
  display: "swap",
  variable: "--font-sahitya",
})

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "700"],
  preload: false,
  display: "swap",
  variable: "--font-noto-serif-sc",
})

const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "700"],
  preload: false,
  display: "swap",
  variable: "--font-noto-serif-jp",
})

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ["400", "700"],
  subsets: ["arabic"],
  preload: false,
  display: "swap",
  variable: "--font-noto-naskh-arabic",
})

const FONT_VARIABLES = [cinzelDecorative, sahitya, notoSerifSC, notoSerifJP, notoNaskhArabic]
  .map((font) => font.variable)
  .join(" ")

export const metadata: Metadata = {
  title: "6AM",
  description: "A 3D game built with React Three Fiber, WebGPU and Rapier.",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={FONT_VARIABLES}>
      <body className="overflow-hidden antialiased">{children}</body>
    </html>
  )
}
