import type { Metadata, Viewport } from"next";
import { Suspense } from "react";
import { Geist, JetBrains_Mono } from "next/font/google";
import"@/styles/globals.css";
import"@/styles/animations.css";
import { WebVitalsProvider } from "@/components/providers/WebVitalsProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LazyChatbotWidget } from "@/components/chatbot/LazyChatbotWidget";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/seo/constants";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Profytron — Algorithmic Trading Platform for Indian Traders",
    template: "%s | Profytron",
  },
  description:
    "Profytron is India's most advanced algorithmic trading platform. Copy top strategies, deploy AI-powered bots, and manage your portfolio with institutional-grade tools. Free trial available.",
  manifest: "/manifest.json",
  // Absolute www icons — Bing/Google often resolve relative /favicon.ico against
  // the indexed host (apex). Apex currently 404s favicon via GoDaddy forwarding,
  // so pin icons to the host that actually serves them.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    title: "Profytron",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "Profytron",
    title: "Profytron — Algorithmic Trading Platform for Indian Traders",
    description:
      "Copy top strategies, deploy AI-powered trading bots, and grow your portfolio with institutional-grade tools. Join 5,000+ traders on Profytron.",
    images: [
      {
        url: "/hero/hero-trading-3d.png",
        width: 1200,
        height: 630,
        alt: "Profytron trading dashboard showing AI analytics and live portfolio",
      },
    ],
    locale: "en_IN",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: "@profytron",
    title: "Profytron — Algo Trading Platform",
    description:
      "AI-powered copy trading, strategy marketplace, and portfolio analytics for Indian traders.",
    images: ["/hero/hero-trading-3d.png"],
  },
  keywords: [
    "algorithmic trading India",
    "copy trading platform",
    "forex trading bots",
    "MT4 MT5 copy trading",
    "AI trading coach",
    "trading strategy marketplace",
    "XAUUSD trading",
    "automated trading India",
    "portfolio analytics",
    "trading platform India",
    "algo trading",
    "prop trading platform",
  ],
  authors: [{ name: "Profytron", url: SITE_URL }],
  creator: "Profytron",
  publisher: "Profytron",
  category: "finance",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
    { media: "(prefers-color-scheme: light)", color: "#368B9D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geist.variable} ${jetbrainsMono.variable} font-sans text-body bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground`}
      >
        <ThemeProvider>
        <WebVitalsProvider />
        <JsonLd type="organization" />
        <JsonLd type="software" />
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
        <LazyChatbotWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
