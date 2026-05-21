import type { NextConfig } from "next";

const backendApiOrigin =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_API_ORIGIN ||
  "https://api.profytron.example";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ["lucide-react"],
  reactCompiler: false,
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
      "@react-three/drei",
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

export default nextConfig;
