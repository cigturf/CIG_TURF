/**
 * Business Settings module — central source for all configurable business data.
 *
 * Server: SettingsService from `@/server/settings`
 * Client: useBusinessSettings() / useSettings()
 * Actions: getBusinessSettingsAction()
 */

export {
  getBusinessSettingsAction,
  getPublicBusinessSettingsAction,
  isBusinessSettingsConfiguredAction,
} from "@/features/business-settings/actions/get-business-settings";
export { useBusinessSettings } from "@/features/business-settings/hooks/use-business-settings";
export { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
export {
  mergePublicBusinessSettings,
  mergeToBusinessSettings,
  parseBusinessSettings,
  resolveBusinessName,
  resolveShortName,
  resolveThemeAccentColor,
  toPublicBusinessSettings,
} from "@/features/business-settings/lib/parse";
export { SettingsService, BusinessSettingsService } from "@/server/settings/settings.service";
export * from "@/features/business-settings/schemas";
export * from "@/features/business-settings/types";
