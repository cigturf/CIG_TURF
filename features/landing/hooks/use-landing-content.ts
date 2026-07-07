"use client";

import { useMemo } from "react";

import { resolveLandingContent } from "@/features/landing/lib/landing-content";
import type { BusinessSettingsPublic } from "@/features/business-settings/types";
import { useConfig } from "@/hooks/use-config";

type UseLandingContentOptions = {
  initialBusinessSettings?: BusinessSettingsPublic | null;
};

export function useLandingContent(options: UseLandingContentOptions = {}) {
  const { publicSettings, displayName, shortName, isLoading, isConfigured } = useConfig({
    initialBusinessSettings: options.initialBusinessSettings,
  });

  const content = useMemo(
    () => resolveLandingContent(publicSettings, displayName, shortName),
    [publicSettings, displayName, shortName],
  );

  return { content, isLoading, isConfigured };
}
