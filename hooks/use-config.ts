"use client";

import { getAppConfig } from "@/config/app.config";
import { useBusinessSettings } from "@/features/business-settings/hooks/use-business-settings";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import {
  mergeToBusinessSettings,
  resolveBusinessName,
  resolveShortName,
  resolveThemeAccentColor,
} from "@/features/business-settings/lib/parse";
import type { BusinessSettingsPublic } from "@/features/business-settings/types";

type UseConfigOptions = {
  initialBusinessSettings?: BusinessSettingsPublic | null;
};

/**
 * Central client hook for consuming application configuration.
 * Merges technical app config with database-driven business settings.
 */
export function useConfig(options: UseConfigOptions = {}) {
  const app = getAppConfig();
  const { settings, isLoading, isConfigured, isError, refetch, themeAccentColor } =
    useBusinessSettings({
      initialData: options.initialBusinessSettings,
    });

  return {
    app,
    business: isConfigured ? mergeToBusinessSettings(settings) : createEmptyBusinessSettings(),
    publicSettings: settings,
    isLoading,
    isConfigured,
    isError,
    refetch,
    displayName: resolveBusinessName(isConfigured ? settings : null, app.envDisplayName),
    shortName: resolveShortName(isConfigured ? settings : null, app.envDisplayName),
    themeAccentColor: themeAccentColor ?? resolveThemeAccentColor(isConfigured ? settings : null),
  };
}

/** Alias for centralized settings consumption */
export const useSettings = useConfig;
