import type { NextConfig } from "next";

import { SECURITY_HEADERS } from "@/lib/security/headers";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/api/media/**" },
      { pathname: "/landing/**" },
      { pathname: "/branding/**" },
    ],
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
            },
          ]
        : []),
      // Legacy absolute URLs saved before normalization (e.g. copied from admin media)
      { protocol: "http" as const, hostname: "localhost" },
      { protocol: "http" as const, hostname: "127.0.0.1" },
    ],
  },
  async headers() {
    const headers = Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
      key,
      value,
    }));

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
