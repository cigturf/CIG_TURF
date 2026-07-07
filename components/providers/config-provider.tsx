"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getAppConfig } from "@/config/app.config";
import { useBusinessSettings } from "@/features/business-settings/hooks/use-business-settings";
import {
  resolveBusinessName,
  resolveShortName,
  resolveThemeAccentColor,
} from "@/features/business-settings/lib/parse";
import type { BusinessSettingsPublic } from "@/features/business-settings/types";

type ConfigContextValue = {
  app: ReturnType<typeof getAppConfig>;
  publicSettings: BusinessSettingsPublic;
  isConfigured: boolean;
  isLoading: boolean;
  displayName: string;
  shortName: string;
  themeAccentColor: string | null;
};

const ConfigContext = createContext<ConfigContextValue | null>(null);

type ConfigProviderProps = {
  children: ReactNode;
  initialBusinessSettings?: BusinessSettingsPublic | null;
};

export function ConfigProvider({ children, initialBusinessSettings }: ConfigProviderProps) {
  const app = getAppConfig();
  const { settings, isLoading, isConfigured, themeAccentColor } = useBusinessSettings({
    initialData: initialBusinessSettings,
  });

  const value = useMemo<ConfigContextValue>(() => {
    return {
      app,
      publicSettings: settings,
      isConfigured,
      isLoading,
      displayName: resolveBusinessName(isConfigured ? settings : null, app.envDisplayName),
      shortName: resolveShortName(isConfigured ? settings : null, app.envDisplayName),
      themeAccentColor: themeAccentColor ?? resolveThemeAccentColor(isConfigured ? settings : null),
    };
  }, [app, settings, isConfigured, isLoading, themeAccentColor]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfigContext(): ConfigContextValue {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfigContext must be used within a ConfigProvider");
  }

  return context;
}
