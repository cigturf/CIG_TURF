"use client";

import Image, { type ImageProps } from "next/image";

import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";

export function isAppMediaSrc(src: string): boolean {
  const normalized = normalizeAppMediaUrl(src);
  return Boolean(normalized?.startsWith("/api/media/"));
}

export type AppMediaImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** next/image wrapper for app-served media — skips optimizer for /api/media routes. */
export function AppMediaImage({ src, unoptimized, ...props }: AppMediaImageProps) {
  const normalizedSrc = normalizeAppMediaUrl(src) ?? src;

  return (
    <Image
      src={normalizedSrc}
      unoptimized={unoptimized ?? isAppMediaSrc(normalizedSrc)}
      {...props}
    />
  );
}
