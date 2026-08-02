import type { Metadata, Viewport } from"next";
import { Suspense } from "react";
import { Geist, JetBrains_Mono } from "next/font/google";
import"@/styles/globals.css";
import"@/styles/animations.css";
import { WebVitalsProvider } from "@/components/providers/WebVitalsProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LazyChatbotWidget } from "@/components/chatbot/LazyChatbotWidget";
import { CookieConsentBanner } from "@/components/cookie/CookieConsentBanner";
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
  applicationName: "Profytron",
  title: {
    default: "Profytron — Forex Trading Bots for MT4/MT5",
    template: "%s | Profytron",
  },
  description:
    "Profytron runs automated trading bots on the forex market via MT4/MT5. Marketplace strategies, paper trading, AI risk limits, and broker connect. Bots-only platform — not a retail India app.",
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
    apple: [{ url: "/icons/icon-192.png", sizes: "180x180", type: "image/png" }],
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
    title: "Profytron — Forex Trading Bots for MT4/MT5",
    description:
      "Automated forex trading bots on MT4/MT5. Deploy marketplace strategies, connect brokers, and enforce risk limits.",
    images: [
      {
        url: "/hero/hero-trading-3d.webp",
        width: 1200,
        height: 630,
        alt: "Profytron forex bots dashboard with live charts and portfolio analytics",
        type: "image/webp",
      },
    ],
    locale: "en_IN",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: "@profytron",
    title: "Profytron — Forex Trading Bots for MT4/MT5",
    description:
      "AI-assisted forex trading bots, marketplace strategies, and portfolio analytics on MT4/MT5.",
    images: ["/hero/hero-trading-3d.webp"],
  },
  keywords: [
    "forex trading bots",
    "MT5 forex bots",
    "MT4 automated forex",
    "forex algorithmic trading",
    "automated forex trading platform",
    "forex EA bots",
    "algo forex trading",
    "MetaTrader 5 bots",
    "forex strategy marketplace",
    "AI forex trading bots",
    "XAUUSD trading bots",
    "forex bot risk management",
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
  colorScheme: "dark light",
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
    <html lang="en-IN" data-scroll-behavior="smooth" suppressHydrationWarning>
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <WebVitalsProvider />
        <JsonLd type="organization" />
        <JsonLd type="software" />
        <Suspense fallback={null}>
          <PostHogProvider>
            <div id="main-content">{children}</div>
          </PostHogProvider>
        </Suspense>
        <LazyChatbotWidget />
        <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
