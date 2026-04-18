import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLAT3S | CONNECT, SAVE & DISCOVER",
  description:
    "Build your Plat3s profile, connect your vehicles, and bring every drive to life with synced music, shared moments, and a digital service book that transfers with your car when you sell.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
