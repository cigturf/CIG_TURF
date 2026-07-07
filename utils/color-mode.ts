import type { ResolvedTheme, ThemeMode } from "@/config/theme.config";

export function isDarkTheme(resolvedTheme: ResolvedTheme | undefined): boolean {
  return resolvedTheme === "dark";
}

export function isLightTheme(resolvedTheme: ResolvedTheme | undefined): boolean {
  return resolvedTheme === "light";
}

export function isSystemTheme(theme: ThemeMode | undefined): boolean {
  return theme === "system" || theme === undefined;
}

export function resolveThemePreference(
  theme: ThemeMode,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  if (theme === "system") return systemTheme;
  return theme;
}
