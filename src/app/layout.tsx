import type { Metadata } from "next"
import { Cinzel_Decorative } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "6AM",
  description: "A 3D game built with React Three Fiber, WebGPU and Rapier.",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cinzelDecorative.className} overflow-hidden antialiased`}>
        {children}
      </body>
    </html>
  )
}
