import type { Metadata, Viewport } from "next";
import { Outfit, Inter, Geist } from "next/font/google";
import "./globals.css";
import PWA from "@/components/PWA";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import CookieConsent from "@/components/CookieConsent";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.description}`,
  description: siteConfig.description,
  manifest: "/manifest.json",
  metadataBase: new URL("https://henry-county-directory-39m1cwpsm.vercel.app"),
};

export const viewport: Viewport = {
  themeColor: "#E8505B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={cn("h-full", "antialiased", outfit.variable, inter.variable, "font-sans", geist.variable)}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-brandBg-app text-brandText-medium font-body">
        <PWA />
        {children}
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  );
}
