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
  // Standalone is for self-hosted Docker; Vercel manages output itself.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  transpilePackages: ["lucide-react"],
  serverExternalPackages: ["pg"],
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true, // Enable gzip compression
  // Allow LAN origin for phone/tablet testing (current Wi‑Fi IP + prior IP).
  allowedDevOrigins: ["192.168.1.17", "192.168.1.7"],
  // Monorepo: pin Turbopack to workspace root so pnpm-hoisted `next` resolves.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),

  // Tree-shake large packages — only import used icons/components
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

  // Strip console.* calls in production builds for smaller bundle + no leaking
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  images: {
    // Serve modern formats automatically
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // Cache images for 24h

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
    // When mock API mode is explicitly enabled, bypass backend rewrites.
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_API === "true") {
      return [];
    }

    // Keep live MetaAPI routes on Next (Vercel). Unmatched /api/* falls through to Nest.
    // Only pin paths that have App Router handlers — do not blanket-rewrite /broker or
    // /market or Nest endpoints (test connection, news, calendar) never reach the API.
    return [
      {
        source: "/api/broker/accounts",
        destination: "/api/broker/accounts",
      },
      {
        source: "/api/broker/accounts/connect",
        destination: "/api/broker/accounts/connect",
      },
      {
        source: "/api/strategies/my",
        destination: "/api/strategies/my",
      },
      {
        source: "/api/trading/trades/:path*",
        destination: "/api/trading/trades/:path*",
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
        source: "/api/analytics/trades",
        destination: "/api/analytics/trades",
      },
      {
        source: "/api/analytics/trades/:path*",
        destination: "/api/analytics/trades/:path*",
      },
      {
        source: "/api/analytics/portfolio",
        destination: "/api/analytics/portfolio",
      },
      {
        source: "/api/analytics/monthly-returns",
        destination: "/api/analytics/monthly-returns",
      },
      {
        source: "/api/analytics/strategy-comparison",
        destination: "/api/analytics/strategy-comparison",
      },
      {
        source: "/api/analytics/risk",
        destination: "/api/analytics/risk",
      },
      {
        source: "/api/analytics/global",
        destination: "/api/analytics/global",
      },
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/v1/:path*`,
      },
    ];
  },

  // Security + caching headers
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
              // Next.js (App Router) hydrates via inline bootstrap scripts, so
              // 'unsafe-inline' is required for the app's own JS to run at all.
              // Production intentionally omits 'unsafe-eval'. Zod v4's
              // Function() JIT probe is disabled via `z.config({ jitless: true })`
              // in src/lib/zod.ts — do not add 'unsafe-eval' for that.
              // In development, React Refresh / webpack HMR still need
              // 'unsafe-eval' or client components can render blank.
              // Payment SDKs are loaded from their own CDNs: Razorpay Checkout
              // (checkout.razorpay.com) and Stripe.js (js.stripe.com). They must
              // be whitelisted in script-src or the browser blocks them.
              // @vercel/analytics (<Analytics /> in layout.tsx) loads its beacon
              // script from va.vercel-scripts.com — must be whitelisted too.
              // Firebase Auth's signInWithRedirect/signInWithPopup for Google
              // loads Google's gapi helper from apis.google.com (distinct from
              // the *.googleapis.com wildcard below — not a subdomain of it)
              // and needs www.gstatic.com for its GIS client assets.
              isProd
                ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://s3.tradingview.com https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com https://va.vercel-scripts.com https://apis.google.com https://www.gstatic.com"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://s3.tradingview.com https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com https://va.vercel-scripts.com https://apis.google.com https://www.gstatic.com",
              // unsafe-inline required by Tailwind CSS and CSS-in-JS at runtime
              "style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://*.tradingview.com https://*.tradingview-widget.com",
              `connect-src 'self' ${backendApiOrigin}${backendWs ? ` ${backendWs}` : ""} https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://apis.google.com https://openrouter.ai https://*.razorpay.com https://lumberjack.razorpay.com https://api.stripe.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://*.googleapis.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io wss://*.ingest.us.sentry.io https://*.tradingview.com https://s3.tradingview.com wss://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com wss://*.tradingview-widget.com`,
              // Razorpay/Stripe payment UI + TradingView chart embeds (widget host is tradingview-widget.com).
              // accounts.google.com + *.firebaseapp.com: Firebase Auth's internal
              // sign-in iframe/handler for Google sign-in.
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
            // Razorpay/Stripe checkout use the Payment Request API — blocking
            // `payment` outright (payment=()) breaks their UPI/wallet fast
            // checkout and logs a permissions-policy violation on every load.
            value:
              'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com" "https://js.stripe.com")',
          },
          {
            key: "Cross-Origin-Opener-Policy",
            // same-origin (rather than same-origin-allow-popups) severs the
            // window.opener/postMessage channel signInWithPopup() needs to
            // learn the Google OAuth popup finished — the popup itself
            // completes fine, but the main window never finds out, so the
            // sign-in silently fails. allow-popups keeps the same isolation
            // from cross-origin openers, just permits popups this page opens.
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

// Bundle analyzer is opt-in and treated as an OPTIONAL dependency: it is only
// require()'d when ANALYZE=true, so normal builds and CI (frozen lockfile) are
// never affected. To use:  pnpm add -D @next/bundle-analyzer && ANALYZE=true pnpm build
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
