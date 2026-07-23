import type { Metadata, Viewport } from "next";
import { Outfit, Inter, Geist } from "next/font/google";
import "./globals.css";
import PWA from "@/components/PWA";
import { cn } from "@/lib/utils";

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

export const metadata: Metadata = {
  title: "Henry County Directory — Discover Your Amazing City",
  description: "Find great places to stay, eat, shop, or visit in Henry County from local experts. Discover restaurants, hotels, jobs, services, and attractions.",
  manifest: "/manifest.json",
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
      lang="en"
      className={cn("h-full", "antialiased", outfit.variable, inter.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-brandBg-app text-brandText-medium font-body">
        <PWA />
        {children}
      </body>
    </html>
  );
}
