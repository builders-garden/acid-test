import { fileURLToPath } from "node:url";
import createJiti from "jiti";
import { createSecureHeaders } from "next-secure-headers";

const jiti = createJiti(fileURLToPath(import.meta.url));
// Import env here to validate during build. Using jiti@^1 we can import .ts files :)
jiti("./lib/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "libsql",
    "@libsql/client",
    "@prisma/adapter-libsql",
  ],
  typedRoutes: true,
  reactStrictMode: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    new URL(process.env.NEXT_PUBLIC_URL).hostname,
  ],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  headers() {
    return [
      {
        locale: false,
        source: "/(.*)",
        headers: createSecureHeaders({
          frameGuard: false,
          noopen: "noopen",
          nosniff: "nosniff",
          xssProtection: "sanitize",
          forceHTTPSRedirect: [
            true,
            { maxAge: 60 * 60 * 24 * 360, includeSubDomains: true },
          ],
          referrerPolicy: "same-origin",
          contentSecurityPolicy: {
            directives: {
              connectSrc: ["*"],
            },
          },
        }),
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
