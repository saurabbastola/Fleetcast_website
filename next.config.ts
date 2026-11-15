import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Django's DRF routes use trailing slashes. Keep API paths intact instead of
  // letting Next redirect them to slashless paths before the rewrite runs.
  skipTrailingSlashRedirect: true,
  images: {
    // Allow images served from your Supabase Storage bucket once you move photos there.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async rewrites() {
    // Proxy browser API calls through Vercel so Django auth cookies remain first-party.
    const apiOrigin = process.env.DJANGO_API_ORIGIN?.replace(/\/$/, "");
    // Next/Vercel normalizes the captured wildcard without its trailing slash;
    // restore DRF's slash-terminated route at the destination.
    return apiOrigin ? [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*/` }] : [];
  },
};

export default nextConfig;
