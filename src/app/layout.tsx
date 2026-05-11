import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// 标题与品牌字体：Cinzel 自带罗马铭文气质，匹配仪式感
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

// 正文衬线字体：Playfair Display 兼具典雅与可读性
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// 站点公开 URL：用于 OG / canonical / sitemap
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://destini.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Destini — Ancient Insight, Ritual Guidance, Inner Healing",
    template: "%s · Destini",
  },
  description:
    "Destini is a digital sanctuary rooted in Chinese I Ching wisdom — Physiognomy, BaZi, Naming, Liu Yao divination, and Healing rituals.",
  applicationName: "Destini",
  keywords: [
    "Destini",
    "I Ching",
    "Physiognomy",
    "BaZi",
    "Chinese astrology",
    "Liu Yao",
    "Naming",
    "Energy healing",
    "Fortune telling",
    "命运",
    "麻衣神相",
    "八字",
    "六爻",
  ],
  authors: [{ name: "Destini" }],
  creator: "Destini",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "zh-CN": "/zh",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Destini",
    title: "Destini — Ancient Insight, Ritual Guidance, Inner Healing",
    description:
      "A digital sanctuary for Physiognomy, BaZi, Naming, Liu Yao divination, and Healing — rooted in the wisdom of the I Ching.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Destini — Ancient Insight, Ritual Guidance, Inner Healing",
    description:
      "A digital sanctuary for Physiognomy, BaZi, Naming, Liu Yao divination, and Healing.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Destini",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", cinzel.variable, playfair.variable, "font-sans", geist.variable)}
    >
      {/* body 透明：背景由页面的 fixed 图层接管，full viewport 铺满 */}
      <body className="min-h-full flex flex-col bg-transparent">
        {children}
      </body>
    </html>
  );
}
