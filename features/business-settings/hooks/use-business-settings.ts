"use client";

import { useQuery } from "@tanstack/react-query";

import { CACHE_TTL } from "@/config/cache.config";
import { QUERY_KEYS } from "@/config/query-keys.config";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { mergePublicBusinessSettings } from "@/features/business-settings/lib/parse";
import { fetchPublicBusinessSettings } from "@/features/business-settings/services/fetch-public-settings";
import type { BusinessSettingsPublic } from "@/features/business-settings/types";

type UseBusinessSettingsOptions = {
  initialData?: BusinessSettingsPublic | null;
  enabled?: boolean;
};

/**
 * Client hook for loading public business settings.
 * Returns empty defaults when settings are not yet configured in the database.
 */
export function useBusinessSettings(options: UseBusinessSettingsOptions = {}) {
  const { initialData, enabled = true } = options;

  const query = useQuery({
    queryKey: QUERY_KEYS.businessSettings.public,
    queryFn: fetchPublicBusinessSettings,
    initialData: initialData ?? undefined,
    staleTime: CACHE_TTL.businessSettings,
    gcTime: CACHE_TTL.defaultGc,
    enabled,
  });

  const empty = createEmptyBusinessSettings();

  return {
    settings: mergePublicBusinessSettings(query.data ?? null),
    isLoading: query.isLoading,
    isError: query.isError,
    isConfigured: query.data !== null && query.data !== undefined,
    refetch: query.refetch,
    themeAccentColor: query.data?.branding.themeAccentColor ?? empty.branding.themeAccentColor,
  };
}

/** Alias for centralized settings consumption */
export const useSettings = useBusinessSettings;
