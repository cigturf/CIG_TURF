"use client";

import Image from "next/image";

import { BRAND_LOGO_ALT, BRAND_LOGOS } from "@/features/landing/lib/brand-logos";
import { useColorMode } from "@/hooks/use-color-mode";
import { cn } from "@/lib/utils";

type BrandLogoSize = "icon" | "nav" | "hero";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: BrandLogoSize;
  /** Always use the light mark (cig-light) for dark/black backgrounds */
  onDarkSurface?: boolean;
  /** Override theme — use settings logo when provided */
  logoUrl?: string | null;
  alt?: string;
};

const SIZE_CLASSES: Record<BrandLogoSize, string> = {
  icon: "size-8 sm:size-9",
  nav: "size-10 sm:size-11",
  hero: "h-full max-h-full w-auto max-w-full",
};

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
  size = "icon",
  onDarkSurface = false,
  logoUrl,
  alt = BRAND_LOGO_ALT,
}: BrandLogoProps) {
  const { isDark, isReady } = useColorMode();
  const src = onDarkSurface || !isReady || isDark ? BRAND_LOGOS.dark : BRAND_LOGOS.light;

  if (logoUrl) {
    return (
      <span className={cn("relative inline-flex shrink-0", className)}>
        <Image
          src={logoUrl}
          alt={alt}
          width={size === "hero" ? 288 : 44}
          height={size === "hero" ? 288 : 44}
          priority={priority}
          className={cn(SIZE_CLASSES[size], "object-contain", imageClassName)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center",
        size === "hero" && "h-full max-h-full",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(SIZE_CLASSES[size], "object-contain", imageClassName)}
        fetchPriority={priority ? "high" : undefined}
      />
    </span>
  );
}
