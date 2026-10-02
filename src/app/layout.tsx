import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Granny Clone",
  description: "A 3D game built with React Three Fiber, WebGPU and Rapier.",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="overflow-hidden antialiased">{children}</body>
    </html>
  )
}
