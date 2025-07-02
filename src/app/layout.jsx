// ❌ لا تضع "use client" هنا
import "./globals.css";

export const metadata = {
  title: "Darsmok Inventory",
  description: "Inventory management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
