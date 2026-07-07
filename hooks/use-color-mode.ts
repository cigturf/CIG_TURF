"use client";

import { useTheme } from "next-themes";

import { DEFAULT_THEME_MODE, type ResolvedTheme, type ThemeMode } from "@/config/theme.config";
import { useMounted } from "@/hooks/use-mounted";
import { isDarkTheme, isLightTheme, isSystemTheme } from "@/utils/color-mode";

type SetThemeMode = (mode: ThemeMode) => void;

export type ColorModeState = {
  /** User-selected theme preference (light | dark | system) */
  theme: ThemeMode;
  /** Actual rendered theme after resolving system preference */
  resolvedTheme: ResolvedTheme | undefined;
  /** OS-level color scheme preference */
  systemTheme: ResolvedTheme | undefined;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  isReady: boolean;
  setTheme: SetThemeMode;
  toggleTheme: () => void;
};

/**
 * Hook for reading and controlling the application color mode.
 * Supports light, dark, and system themes.
 */
export function useColorMode(): ColorModeState {
  const mounted = useMounted();
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

  const currentTheme = (theme as ThemeMode | undefined) ?? DEFAULT_THEME_MODE;
  const resolved = resolvedTheme as ResolvedTheme | undefined;

  const setThemeMode: SetThemeMode = (mode) => setTheme(mode);

  const toggleTheme = () => {
    if (resolved === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return {
    theme: currentTheme,
    resolvedTheme: resolved,
    systemTheme: systemTheme as ResolvedTheme | undefined,
    isDark: isDarkTheme(resolved),
    isLight: isLightTheme(resolved),
    isSystem: isSystemTheme(currentTheme),
    isReady: mounted,
    setTheme: setThemeMode,
    toggleTheme,
  };
}
