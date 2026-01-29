import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotdrop | Instant Private Sync",
  description: "Drop text or images to sync across devices instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}