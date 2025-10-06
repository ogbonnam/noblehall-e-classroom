import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NHERC",
  description: "Noble Hall Electronic Resource Center",
  icons: {
    icon: "/icon.png", // 👈 tell Next.js the exact icon path
  },
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
