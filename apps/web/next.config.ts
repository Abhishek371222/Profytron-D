import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  reactCompiler: true,
  compress: true, // Enable gzip compression

  // Tree-shake large packages — only import used icons/components
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "recharts",
      "@react-three/drei",
    ],
  },

  images: {
    // Serve modern formats automatically
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // Cache images for 24h

    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/v1/:path*",
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
        ],
      },
    ];
  },
};

export default nextConfig;
