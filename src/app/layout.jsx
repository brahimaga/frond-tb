import "./globals.css";

export const metadata = {
  title: "Darsmok Inventory",
  description: "Inventory management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}