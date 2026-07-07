import { businessSettingsSchema } from "@/features/business-settings/schemas";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import type { BusinessSettings, BusinessSettingsPublic } from "@/features/business-settings/types";
import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeDefaults<T extends Record<string, unknown>>(
  defaults: T,
  partial: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = { ...defaults };

  for (const [key, partialValue] of Object.entries(partial)) {
    const defaultValue = defaults[key];

    if (isPlainObject(partialValue) && isPlainObject(defaultValue)) {
      result[key] = deepMergeDefaults(defaultValue, partialValue);
      continue;
    }

    if (partialValue !== undefined) {
      result[key] = partialValue;
    }
  }

  return result as T;
}

function normalizeBrandingMediaUrls<T extends Pick<BusinessSettings, "branding">>(settings: T): T {
  return {
    ...settings,
    branding: {
      ...settings.branding,
      logoUrl: normalizeAppMediaUrl(settings.branding.logoUrl),
      faviconUrl: normalizeAppMediaUrl(settings.branding.faviconUrl),
    },
  };
}

/**
 * Validates and parses raw JSON from the database into typed BusinessSettings.
 * Partial or legacy records are merged with empty defaults before validation.
 * Returns null only when merged data still fails schema validation.
 */
export function parseBusinessSettings(data: unknown): BusinessSettings | null {
  const empty = createEmptyBusinessSettings();
  const candidate = isPlainObject(data)
    ? deepMergeDefaults(empty as unknown as Record<string, unknown>, data)
    : empty;

  const result = businessSettingsSchema.safeParse(candidate);

  if (!result.success) {
    console.error("[BusinessSettings] Invalid settings data:", result.error.flatten());
    return null;
  }

  return normalizeBrandingMediaUrls(result.data);
}

/**
 * Extracts public-facing settings safe for client consumption.
 * Excludes private email configuration and internal booking/pricing fields.
 */
export function toPublicBusinessSettings(settings: BusinessSettings): BusinessSettingsPublic {
  const empty = createEmptyBusinessSettings();

  return {
    branding: settings.branding ?? empty.branding,
    media: settings.media ?? empty.media,
    contact: settings.contact ?? empty.contact,
    booking: { rules: settings.booking?.rules ?? empty.booking.rules },
    pricing: {
      currency: settings.pricing?.currency ?? empty.pricing.currency,
      tiers: settings.pricing?.tiers ?? empty.pricing.tiers,
    },
    operations: {
      timezone: settings.operations?.timezone ?? empty.operations.timezone,
      businessHours: settings.operations?.businessHours ?? empty.operations.businessHours,
      maintenanceMode:
        settings.operations?.maintenanceMode ?? empty.operations.maintenanceMode,
      maintenanceMessage:
        settings.operations?.maintenanceMessage ?? empty.operations.maintenanceMessage,
    },
    content: settings.content ?? empty.content,
  };
}

/**
 * Merges public settings into a full BusinessSettings shape with private fields empty.
 */
export function mergeToBusinessSettings(publicSettings: BusinessSettingsPublic): BusinessSettings {
  const empty = createEmptyBusinessSettings();

  return {
    ...empty,
    branding: publicSettings.branding,
    media: publicSettings.media,
    contact: publicSettings.contact,
    booking: { ...empty.booking, rules: publicSettings.booking.rules },
    pricing: {
      ...empty.pricing,
      currency: publicSettings.pricing.currency,
      tiers: publicSettings.pricing.tiers,
    },
    operations: {
      ...empty.operations,
      timezone: publicSettings.operations.timezone,
      businessHours: publicSettings.operations.businessHours,
      maintenanceMode: publicSettings.operations.maintenanceMode,
      maintenanceMessage: publicSettings.operations.maintenanceMessage,
    },
    content: publicSettings.content,
  };
}

/**
 * Builds a full public settings object from partial/null data.
 */
export function mergePublicBusinessSettings(
  partial: BusinessSettingsPublic | null,
): BusinessSettingsPublic {
  const empty = createEmptyBusinessSettings();
  const publicEmpty = toPublicBusinessSettings(empty);

  if (!partial) return publicEmpty;

  return {
    branding: partial.branding ?? publicEmpty.branding,
    media: partial.media ?? publicEmpty.media,
    contact: partial.contact ?? publicEmpty.contact,
    booking: partial.booking ?? publicEmpty.booking,
    pricing: partial.pricing ?? publicEmpty.pricing,
    operations: partial.operations ?? publicEmpty.operations,
    content: partial.content ?? publicEmpty.content,
  };
}

export function resolveBusinessName(
  settings: Pick<BusinessSettings, "branding"> | null,
  envFallback: string,
): string {
  return settings?.branding.businessName ?? envFallback;
}

export function resolveShortName(
  settings: Pick<BusinessSettings, "branding"> | null,
  envFallback: string,
): string {
  return settings?.branding.shortName ?? envFallback;
}

export function resolveThemeAccentColor(
  settings: Pick<BusinessSettings, "branding"> | null,
): string | null {
  return settings?.branding.themeAccentColor ?? null;
}
