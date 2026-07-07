import type { MetadataRoute } from "next";

import { getPwaManifest } from "@/config/pwa.config";
import { resolveMetadataConfig } from "@/config/resolve-config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const meta = await resolveMetadataConfig();

  return getPwaManifest({
    name: meta.title,
    shortName: meta.shortName,
    description: meta.description,
  });
}
