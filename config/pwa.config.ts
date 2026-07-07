import type { MetadataRoute } from "next";

import { getAppConfig } from "@/config/app.config";

export const PWA_ICON_PATHS = {
  icon192: "/icons/icon-192x192.png",
  icon512: "/icons/icon-512x512.png",
  appleTouchIcon: "/icons/apple-touch-icon.png",
  maskIcon: "/icons/safari-pinned-tab.svg",
} as const;

export type PwaConfig = {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  display: MetadataRoute.Manifest["display"];
  backgroundColor: string;
  themeColor: string;
};

/**
 * PWA manifest configuration.
 * Business-facing name/description will be overridden by Business Settings when available.
 */
export function getPwaManifest(overrides?: Partial<PwaConfig>): MetadataRoute.Manifest {
  const app = getAppConfig();

  const config: PwaConfig = {
    name: overrides?.name ?? app.envDisplayName,
    shortName: overrides?.shortName ?? app.envDisplayName,
    description: overrides?.description ?? "Turf booking and management",
    startUrl: overrides?.startUrl ?? "/",
    display: overrides?.display ?? "standalone",
    backgroundColor: overrides?.backgroundColor ?? "#1a1f2e",
    themeColor: overrides?.themeColor ?? "#3d8b5c",
  };

  return {
    name: config.name,
    short_name: config.shortName,
    description: config.description,
    start_url: config.startUrl,
    display: config.display,
    background_color: config.backgroundColor,
    theme_color: config.themeColor,
    orientation: "portrait-primary",
    icons: [
      {
        src: PWA_ICON_PATHS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_PATHS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_PATHS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
