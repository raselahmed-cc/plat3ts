import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-GQ6KWT8PB7";

export const metadata: Metadata = {
  title: "PLAT3S | CONNECT, SAVE & DISCOVER",
  description:
    "Build your PLAT3S profile, connect your vehicles, and bring every drive to life with synced music, shared moments, and a digital service book that transfers with your car when you sell.",
  openGraph: {
    title: "PLAT3S | CONNECT, SAVE & DISCOVER",
    description:
      "Build your PLAT3S profile, connect your vehicles, and bring every drive to life with synced music, shared moments, and a digital service book that transfers with your car when you sell.",
    url: "https://plat3s.com",
    siteName: "PLAT3S",
    images: [
      {
        url: "https://plat3s.com/PLATES-SHARE-LINK.jpg",
        width: 1200,
        height: 630,
        alt: "PLAT3S - Connect, Save & Discover",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PLAT3S | CONNECT, SAVE & DISCOVER",
    description:
      "Build your PLAT3S profile, connect your vehicles, and bring every drive to life with synced music, shared moments, and a digital service book that transfers with your car when you sell.",
    images: ["https://plat3s.com/PLATES-SHARE-LINK.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Nunito+Sans:wght@400;500;600;700&display=swap"
        />
        <link rel="preconnect" href="https://jlr.scene7.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.hsforms.com" />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
