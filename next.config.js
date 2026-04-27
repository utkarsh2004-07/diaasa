/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") || "localhost",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS,PATCH" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/api/banners",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },
  async rewrites() {
    return [];
  },
  serverExternalPackages: ["pdfkit"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
};

module.exports = nextConfig;
