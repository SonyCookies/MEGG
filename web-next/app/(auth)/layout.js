import '../globals.css'

import { inter } from '../components/Font';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased` } >
        {children}
      </body>
    </html>
  );
}
