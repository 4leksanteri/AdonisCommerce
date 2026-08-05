import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Proxies uploaded-file requests to the API server-side, so the browser
  // only ever talks to this app's own origin — the API's actual host/port
  // (an internal docker-network address in production) is never exposed.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.API_INTERNAL_URL}/uploads/:path*`,
      },
    ];
  },
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body cap, too small for image
      // uploads (uploadProductImagesAction sends real file bytes as
      // FormData). Matches the API's own multipart limit (bodyparser.ts) —
      // the API's per-file/total limits are the real constraint from here.
      bodySizeLimit: "20mb",
    },
  },
};

export default withNextIntl(nextConfig);
