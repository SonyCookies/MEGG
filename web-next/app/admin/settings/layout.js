import "../../globals.css"
import { inter } from "../../components/Font";

export const metadata = {
  title: "Overview",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased text-base`}>
        {children}
      </body>
    </html>
  );
}