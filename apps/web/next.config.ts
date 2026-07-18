import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { NOINDEX_ROUTE_PREFIXES } from "./src/lib/seo/private-routes";

const backendApiOrigin =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_API_ORIGIN ||
  "http://localhost:4000";

function backendWsOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.origin;
  } catch {
    return "";
  }
}

const backendWs = backendWsOrigin(backendApiOrigin);

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  transpilePackages: ["lucide-react", "@profytron/ai-coach"],
  serverExternalPackages: ["pg"],
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  allowedDevOrigins: ["192.168.1.17", "192.168.1.7"],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@tanstack/react-query",
      "sonner",
      "reactflow",
      "gsap",
      "lenis",
      "socket.io-client",
      "three",
      "zustand",
      "react-hook-form",
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,

    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", port: "", pathname: "/storage/**" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
    ],
  },

  async redirects() {
    return [
      { source: '/documentation', destination: '/docs', permanent: true },
      { source: '/press', destination: '/', permanent: true },
      { source: '/copy-trading', destination: '/get-bots', permanent: false },
    ];
  },

  async rewrites() {
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_API === "true") {
      return [];
    }

    return [
      {
        source: "/api/broker/accounts/connect",
        destination: "/api/broker/accounts/connect",
      },
      {
        source: "/api/strategies/my",
        destination: "/api/strategies/my",
      },
      {
        source: "/api/trading/trades/order",
        destination: "/api/trading/trades/order",
      },
      {
        source: "/api/trading/trades/bulk-close",
        destination: "/api/trading/trades/bulk-close",
      },
      {
        source: "/api/trading/trades/:id/close",
        destination: "/api/trading/trades/:id/close",
      },
      {
        source: "/api/trading/trades/:id/modify",
        destination: "/api/trading/trades/:id/modify",
      },
      {
        source: "/api/trading/trades/:id/break-even",
        destination: "/api/trading/trades/:id/break-even",
      },
      {
        source: "/api/trading/trades/:id/trailing-stop",
        destination: "/api/trading/trades/:id/trailing-stop",
      },
      {
        source: "/api/trading/lot-size",
        destination: "/api/trading/lot-size",
      },
      {
        source: "/api/copy/:path*",
        destination: "/api/copy/:path*",
      },
      {
        source: "/api/market/quotes",
        destination: "/api/market/quotes",
      },
      {
        source: "/api/market/quote",
        destination: "/api/market/quote",
      },
      {
        source: "/api/market/ohlc",
        destination: "/api/market/ohlc",
      },
      {
        source: "/api/market/bias",
        destination: "/api/market/bias",
      },
      {
        source: "/api/market/news-image",
        destination: "/api/market/news-image",
      },
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/v1/:path*`,
      },
    ];
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    
    return [
      ...NOINDEX_ROUTE_PREFIXES.map((prefix) => ({
        source: `${prefix}/:path*`,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      })),
      {
        source: "/:path*.(js|css|woff2|png|jpg|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: isProd 
              ? "public, max-age=31536000, immutable"
              : "no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              isProd
                ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://s3.tradingview.com https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com https://va.vercel-scripts.com https://apis.google.com https://www.gstatic.com"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://s3.tradingview.com https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com https://va.vercel-scripts.com https://apis.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://*.tradingview.com https://*.tradingview-widget.com",
              `connect-src 'self' ${backendApiOrigin}${backendWs ? ` ${backendWs}` : ""} https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://apis.google.com https://openrouter.ai https://*.razorpay.com https://lumberjack.razorpay.com https://api.stripe.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://*.googleapis.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io wss://*.ingest.us.sentry.io https://*.tradingview.com https://s3.tradingview.com wss://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com wss://*.tradingview-widget.com`,
              "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://js.stripe.com https://hooks.stripe.com https://*.tradingview.com https://s.tradingview.com https://www.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com https://accounts.google.com https://*.firebaseapp.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              ...(isProd ? ["upgrade-insecure-requests"] : []),
            ].join('; '),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com" "https://js.stripe.com")',
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

const withSentry = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      webpack: {
        treeshake: { removeDebugLogging: true },
        automaticVercelMonitors: false,
      },
    })
  : nextConfig;

let finalConfig: NextConfig = withSentry;
if (process.env.ANALYZE === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });
    finalConfig = withBundleAnalyzer(withSentry);
  } catch {
    console.warn("[next.config] ANALYZE=true but @next/bundle-analyzer is not installed. Run: pnpm add -D @next/bundle-analyzer");
  }
}

export default finalConfig;
