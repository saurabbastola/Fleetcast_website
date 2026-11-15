import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Allow images served from your Supabase Storage bucket once you move photos there.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async rewrites() {
    // Proxy browser API calls through Vercel so Django auth cookies remain first-party.
    const apiOrigin = process.env.DJANGO_API_ORIGIN?.replace(/\/$/, "");
    return apiOrigin ? [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }] : [];
  },
};

export default nextConfig;
