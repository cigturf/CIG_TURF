"use client";

import { useEffect } from "react";

import { useConfigContext } from "@/components/providers/config-provider";

const BRAND_ACCENT_VAR = "--brand-accent";

/**
 * Injects the business-configured theme accent color as a CSS custom property.
 * Falls back to design-system defaults when not configured.
 */
export function ThemeAccentProvider() {
  const { themeAccentColor } = useConfigContext();

  useEffect(() => {
    const root = document.documentElement;

    if (themeAccentColor) {
      root.style.setProperty(BRAND_ACCENT_VAR, themeAccentColor);
    } else {
      root.style.removeProperty(BRAND_ACCENT_VAR);
    }

    return () => {
      root.style.removeProperty(BRAND_ACCENT_VAR);
    };
  }, [themeAccentColor]);

  return null;
}
