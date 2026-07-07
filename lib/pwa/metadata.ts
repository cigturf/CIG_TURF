import type { Metadata, Viewport } from "next";

import { PWA_ICON_PATHS } from "@/config/pwa.config";
import { resolveMetadataConfig } from "@/config/resolve-config";
import { getAppConfig } from "@/config/app.config";

export async function buildRootMetadata(): Promise<Metadata> {
  const app = getAppConfig();
  const meta = await resolveMetadataConfig();

  return {
    title: {
      default: meta.title,
      template: `%s · ${meta.title}`,
    },
    description: meta.description,
    metadataBase: new URL(app.url),
    applicationName: meta.title,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: meta.shortName,
    },
    formatDetection: {
      telephone: true,
    },
    icons: {
      icon: PWA_ICON_PATHS.icon192,
      apple: PWA_ICON_PATHS.appleTouchIcon,
      other: [
        {
          rel: "mask-icon",
          url: PWA_ICON_PATHS.maskIcon,
        },
      ],
    },
    manifest: "/manifest.webmanifest",
  };
}

export function buildRootViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
      { media: "(prefers-color-scheme: dark)", color: "#1a1f2e" },
    ],
  };
}
