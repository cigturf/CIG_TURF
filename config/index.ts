/**
 * Central configuration layer.
 * All modules should consume settings from here — never hardcode business values.
 */

export { getAppConfig, type AppConfig } from "@/config/app.config";
export {
  getAppEnvironment,
  isDeployedEnvironment,
  isProductionEnvironment,
  type AppEnvironment,
} from "@/config/runtime.config";
export { APP_VERSION } from "@/config/version.config";
export { BREAKPOINTS, type Breakpoint } from "@/config/breakpoints.config";
export { QUERY_KEYS } from "@/config/query-keys.config";
export {
  DEFAULT_THEME_MODE,
  THEME_MODES,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from "@/config/theme.config";
export { getPwaManifest, PWA_ICON_PATHS, type PwaConfig } from "@/config/pwa.config";
export { MODULE_KEYS, type ModuleKey } from "@/config/modules.config";
export { resolveConfig, resolveMetadataConfig, type ResolvedConfig } from "@/config/resolve-config";
