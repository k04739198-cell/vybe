import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://vybe-two-gamma.vercel.app'
  ),
  title: "Vybe — Random Video Chat. Meet Strangers Instantly.",
  description:
    "Vybe connects you to real people via live video, instantly. No sign up, no login. Just open and start.",
  keywords: [
    "vybe",
    "random video chat",
    "meet strangers instantly",
    "video chat with strangers",
    "south asia video chat",
    "omegle alternative",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Vybe — Random Video Chat. Meet Strangers Instantly.",
    description:
      "Vybe connects you to real people via live video, instantly. No sign up, no login. Just open and start.",
    url: "https://vybe-two-gamma.vercel.app",
    siteName: "Vybe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vybe — Random Video Chat. Meet Strangers Instantly.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vybe — Random Video Chat. Meet Strangers Instantly.",
    description:
      "Vybe connects you to real people via live video, instantly. No sign up, no login. Just open and start.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#0B0B0F] text-white">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0B0B0F] select-none touch-manipulation`}
      >
        {children}
      </body>
    </html>
  );
}
