import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land Rover | Explore Luxury SUVs & 4x4 Vehicles",
  description:
    "Explore the world of Land Rover. Choose from Range Rover, Defender or Discovery to find the right luxury SUV for you.",
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
