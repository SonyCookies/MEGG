// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\layout.js

import { WebSocketProvider } from "./contexts/WebSocketContext"
import { InternetConnectionProvider } from "./contexts/InternetConnectionContext"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata = {
  title: "MEGG Kiosk",
  description: "Machine registration and defect detection dashboard",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <InternetConnectionProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
        </InternetConnectionProvider>
      </body>
    </html>
  )
}

