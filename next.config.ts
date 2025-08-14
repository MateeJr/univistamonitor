import type { NextConfig } from "next";

// Read backend target from env. Defaults match src/components/config/server.ts
const SERVER_HOST = process.env.NEXT_PUBLIC_SERVER_HOST || "145.239.65.119";
const SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT || "20070";
const TARGET = `http://${SERVER_HOST}:${SERVER_PORT}`;

const nextConfig: NextConfig = {
  // Allow production builds to pass despite ESLint or TS issues.
  // We rely on CI/local to enforce these rules while keeping Vercel deploys unblocked.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Proxy selected routes to the HTTP backend so the browser only talks to this origin over HTTPS.
  // Important: Do NOT rewrite our internal API routes such as /api/accounts/*.
  async rewrites() {
    return [
      // health
      { source: "/health", destination: `${TARGET}/health` },

      // specific backend namespaces under /api (avoid catching /api/accounts/* which is handled by Next API routes)
      { source: "/api/time", destination: `${TARGET}/api/time` },
      { source: "/api/system/:path*", destination: `${TARGET}/api/system/:path*` },
      { source: "/api/network/:path*", destination: `${TARGET}/api/network/:path*` },
      { source: "/api/laporan/:path*", destination: `${TARGET}/api/laporan/:path*` },
      { source: "/api/workers/:path*", destination: `${TARGET}/api/workers/:path*` },
      { source: "/api/stock/:path*", destination: `${TARGET}/api/stock/:path*` },

      // frontend-scoped auth/api used by the app
      { source: "/frontend/:path*", destination: `${TARGET}/frontend/:path*` },

      // auth endpoints that some server routes use
      { source: "/auth/:path*", destination: `${TARGET}/auth/:path*` },

      // static file mounts from backend
      { source: "/files/:path*", destination: `${TARGET}/files/:path*` },

      // other JSON assets used by admin route fallback
      { source: "/Account/:path*", destination: `${TARGET}/Account/:path*` },
    ];
  },
};

export default nextConfig;
