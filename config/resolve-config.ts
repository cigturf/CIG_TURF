import { getAppConfig } from "@/config/app.config";
import { resolveBusinessName, resolveShortName } from "@/features/business-settings/lib/parse";
import { SettingsService } from "@/server/settings/settings.service";
import type { BusinessSettings } from "@/features/business-settings/types";

export type ResolvedConfig = {
  app: ReturnType<typeof getAppConfig>;
  business: BusinessSettings;
  isConfigured: boolean;
  displayName: string;
  shortName: string;
};

/**
 * Server-side resolver that merges app config with business settings.
 * All modules should use this instead of hardcoding values.
 */
export async function resolveConfig(): Promise<ResolvedConfig> {
  const app = getAppConfig();
  const business = await SettingsService.getOrEmpty();
  const isConfigured = await SettingsService.isConfigured();

  return {
    app,
    business,
    isConfigured,
    displayName: resolveBusinessName(isConfigured ? business : null, app.envDisplayName),
    shortName: resolveShortName(isConfigured ? business : null, app.envDisplayName),
  };
}

/**
 * Lightweight server helper for metadata generation.
 */
export async function resolveMetadataConfig() {
  const config = await resolveConfig();

  return {
    title: config.displayName,
    description:
      config.business.branding.description ??
      config.business.branding.tagline ??
      "Turf booking and management",
    shortName: config.shortName,
  };
}
