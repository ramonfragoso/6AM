import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "6AM",
  description: "A 3D game built with React Three Fiber, WebGPU and Rapier.",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="overflow-hidden antialiased">{children}</body>
    </html>
  )
}
