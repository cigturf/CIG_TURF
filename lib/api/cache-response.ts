import { NextResponse } from "next/server";

/** Adds CDN-friendly cache headers for public read-only API responses. */
export function jsonWithPublicCache<T>(data: T, maxAgeSeconds: number): NextResponse<T> {
  const response = NextResponse.json(data);
  response.headers.set(
    "Cache-Control",
    `public, max-age=${Math.min(maxAgeSeconds, 60)}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`,
  );
  return response;
}
