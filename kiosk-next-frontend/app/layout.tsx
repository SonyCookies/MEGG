import { NetworkProvider } from "./contexts/NetworkContext"
import { CameraProvider } from "./contexts/CameraContext"
import { Poppins } from "next/font/google"
import "./globals.css"
import type { ReactNode } from "react"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata = {
  title: "MEGG Kiosk",
  description: "Machine registration and defect detection dashboard",
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <NetworkProvider>
          <CameraProvider>{children}</CameraProvider>
        </NetworkProvider>
      </body>
    </html>
  )
}
