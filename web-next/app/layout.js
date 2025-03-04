// import { Poppins } from "next/font/google";
import './globals.css'
import { inter } from './components/Font';

// const poppins = Poppins({
//   variable: "--font-poppins",
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"], // Customize weights as needed
// });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
