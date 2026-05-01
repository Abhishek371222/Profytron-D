import type { Metadata } from"next";
import { Syne, DM_Sans, JetBrains_Mono, Instrument_Serif } from"next/font/google";
import"@/styles/globals.css";
import"@/styles/animations.css";
import { TooltipProvider } from"@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { MSWProvider } from "@/components/providers/MSWProvider";
import { WebVitalsProvider } from "@/components/providers/WebVitalsProvider";

const syne = Syne({
 subsets: ["latin"],
 variable: "--font-syne",
 display: "swap",
 preload: true,
});

const dmSans = DM_Sans({
 subsets: ["latin"],
 variable: "--font-dm-sans",
 display: "swap",
 preload: true,
});

const jetbrainsMono = JetBrains_Mono({
 subsets: ["latin"],
 variable: "--font-mono",
 display: "swap",
 preload: false,
});

const instrumentSerif = Instrument_Serif({
 subsets: ["latin"],
 weight: "400",
 variable: "--font-accent",
 display: "swap",
 preload: false,
});

export const metadata: Metadata = {
  title: "PROFYTRON | Ultimate Fintech Intelligence",
  description:
    "Experience the next generation of algorithmic trading and institutional-grade portfolio management.",
  metadataBase: new URL("https://profytron.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Profytron",
    statusBarStyle: "black-translucent",
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
  ],
  openGraph: {
    type: "website",
    siteName: "Profytron",
    title: "PROFYTRON | Ultimate Fintech Intelligence",
    description:
      "The world's most advanced algorithmic trading and copy trading platform.",
    images: [{ url: "/images/hero-core.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PROFYTRON | Fintech Intelligence",
    description: "Algorithmic trading, copy trading, and AI coaching.",
    images: ["/images/hero-core.png"],
  },
  keywords: [
    "forex trading",
    "copy trading",
    "algo trading",
    "AI trading coach",
    "XAUUSD",
    "crypto trading",
    "trading platform India",
  ],
};

import QueryProvider from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} font-body bg-bg-base text-slate-50 antialiased selection:bg-p/30 selection:text-white`}
      >
        <QueryProvider>
          <WebVitalsProvider />
          <MSWProvider>
            <AuthProvider><TooltipProvider>{children}</TooltipProvider></AuthProvider>
          </MSWProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
