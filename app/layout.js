import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Prépa FPC",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%23dc2626'/><text x='50' y='70' font-size='42' font-weight='900' font-family='Arial,sans-serif' fill='white' text-anchor='middle'>FPC</text></svg>"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
