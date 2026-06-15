import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const backendApiOrigin =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_API_ORIGIN ||
  "http://localhost:4000";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ["lucide-react"],
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true, // Enable gzip compression
  allowedDevOrigins: ["192.168.1.7"],

  // Tree-shake large packages — only import used icons/components
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "recharts",
      "framer-motion",
      "@tanstack/react-query",
      "sonner",
      "reactflow",
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
    ],
  },

  async rewrites() {
    // When mock API mode is explicitly enabled, bypass backend rewrites.
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_API === "true") {
      return [];
    }

    return [
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
              // In development, React Refresh / webpack HMR additionally need
              // 'unsafe-eval'. Without these the browser blocks all page JS and
              // client components render blank. (Replace with per-request nonces
              // if/when SSR nonce injection is wired up.)
              // Payment SDKs are loaded from their own CDNs: Razorpay Checkout
              // (checkout.razorpay.com) and Stripe.js (js.stripe.com). They must
              // be whitelisted in script-src or the browser blocks them.
              isProd
                ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://checkout.razorpay.com https://js.stripe.com"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://checkout.razorpay.com https://js.stripe.com",
              // unsafe-inline required by Tailwind CSS and CSS-in-JS at runtime
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src 'self' ${backendApiOrigin} https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://*.razorpay.com https://lumberjack.razorpay.com https://api.stripe.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com`,
              // Razorpay/Stripe render their payment UI inside iframes.
              "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://js.stripe.com https://hooks.stripe.com",
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
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
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

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
