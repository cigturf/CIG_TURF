import { cache } from "react";

import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import {
  parseBusinessSettings,
  resolveThemeAccentColor,
  toPublicBusinessSettings,
} from "@/features/business-settings/lib/parse";
import type {
  BookingSettings,
  BrandingSettings,
  BusinessSettings,
  BusinessSettingsPublic,
  ContactSettings,
  ContentSettings,
  EmailSettings,
  MediaSettings,
  OperationsSettings,
  PricingSettings,
} from "@/features/business-settings/types";
import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";
import { resolvePublicLogoUrl } from "@/features/media/services/resolve-public-media";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const SETTINGS_RECORD_ID = "default";

function isSupabaseBackendEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function isDatabaseUnavailable(error: unknown): boolean {
  const messages: string[] = [];

  const collect = (err: unknown) => {
    if (!err) return;
    if (err instanceof Error) {
      messages.push(err.message);
      if ("cause" in err) collect(err.cause);
      return;
    }
    messages.push(String(err));
  };

  collect(error);
  const message = messages.join(" ");

  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (
      code === "ECONNREFUSED" ||
      code === "P1000" ||
      code === "P1001" ||
      code === "P1017"
    ) {
      return true;
    }
  }

  return (
    message.includes("ENOTFOUND") ||
    message.includes("tenant/user") ||
    message.includes("Authentication failed") ||
    message.includes("credentials") ||
    message.includes("password authentication failed") ||
    message.includes("ECIRCUITBREAKER") ||
    message.includes("too many authentication failures") ||
    message.includes("DriverAdapterError")
  );
}

async function getSettingsViaSupabase(): Promise<
  | { status: "found"; settings: BusinessSettings }
  | { status: "missing" }
  | { status: "unavailable" }
> {
  const supabase = createServiceRoleClient();
  if (!supabase) return { status: "unavailable" };

  const { data, error } = await supabase
    .from("business_settings")
    .select("data")
    .eq("id", SETTINGS_RECORD_ID)
    .maybeSingle();

  if (error) {
    console.error("[SettingsService] Supabase lookup failed:", error.message);
    return { status: "unavailable" };
  }

  if (!data?.data) return { status: "missing" };

  const settings = parseBusinessSettings(data.data);
  if (!settings) return { status: "missing" };

  return { status: "found", settings };
}

async function isConfiguredViaSupabase(): Promise<boolean | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("business_settings")
    .select("id")
    .eq("id", SETTINGS_RECORD_ID)
    .maybeSingle();

  if (error) {
    console.error("[SettingsService] Supabase lookup failed:", error.message);
    return null;
  }

  return Boolean(data);
}

async function loadSettings(): Promise<BusinessSettings | null> {
  if (isSupabaseBackendEnabled()) {
    const supabaseResult = await getSettingsViaSupabase();
    if (supabaseResult.status === "found") return supabaseResult.settings;
    return null;
  }

  try {
    const record = await prisma.businessSettings.findUnique({
      where: { id: SETTINGS_RECORD_ID },
    });

    if (!record) return null;

    return parseBusinessSettings(record.data);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      console.error("[SettingsService] Failed to load settings:", error);
    }
    return null;
  }
}

const getCachedSettings = cache(loadSettings);

async function enrichPublicSettings(
  settings: BusinessSettingsPublic,
): Promise<BusinessSettingsPublic> {
  const branding = {
    ...settings.branding,
    logoUrl: normalizeAppMediaUrl(settings.branding.logoUrl),
    faviconUrl: normalizeAppMediaUrl(settings.branding.faviconUrl),
  };

  if (branding.logoUrl) {
    return { ...settings, branding };
  }

  const logoUrl = await resolvePublicLogoUrl();
  if (!logoUrl) return settings;

  return {
    ...settings,
    branding: {
      ...settings.branding,
      logoUrl,
    },
  };
}

const getCachedPublicSettings = cache(async (): Promise<BusinessSettingsPublic | null> => {
  try {
    const settings = (await getCachedSettings()) ?? createEmptyBusinessSettings();
    const publicSettings = toPublicBusinessSettings(settings);
    return enrichPublicSettings(publicSettings);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      console.error("[SettingsService] Failed to load public settings:", error);
    }
    const fallback = toPublicBusinessSettings(createEmptyBusinessSettings());
    return enrichPublicSettings(fallback);
  }
});

/**
 * Centralized Settings Service — single entry point for all configuration.
 * Future modules (booking, pricing, landing, admin, notifications) must consume
 * settings through this service instead of hardcoded values.
 */
export class SettingsService {
  // ─── Core accessors ────────────────────────────────────────────────────────

  static async get(): Promise<BusinessSettings | null> {
    return getCachedSettings();
  }

  static async getOrEmpty(): Promise<BusinessSettings> {
    return (await getCachedSettings()) ?? createEmptyBusinessSettings();
  }

  static async getPublic(): Promise<BusinessSettingsPublic | null> {
    return getCachedPublicSettings();
  }

  static async isConfigured(): Promise<boolean> {
    if (isSupabaseBackendEnabled()) {
      const supabaseConfigured = await isConfiguredViaSupabase();
      return supabaseConfigured ?? false;
    }

    try {
      const count = await prisma.businessSettings.count({
        where: { id: SETTINGS_RECORD_ID },
      });
      return count > 0;
    } catch {
      return false;
    }
  }

  // ─── Module-specific accessors ───────────────────────────────────────────

  static async getBranding(): Promise<BrandingSettings> {
    return (await SettingsService.getOrEmpty()).branding;
  }

  static async getMedia(): Promise<MediaSettings> {
    return (await SettingsService.getOrEmpty()).media;
  }

  static async getContact(): Promise<ContactSettings> {
    return (await SettingsService.getOrEmpty()).contact;
  }

  static async getEmails(): Promise<EmailSettings> {
    return (await SettingsService.getOrEmpty()).emails;
  }

  static async getBooking(): Promise<BookingSettings> {
    return (await SettingsService.getOrEmpty()).booking;
  }

  static async getPricing(): Promise<PricingSettings> {
    return (await SettingsService.getOrEmpty()).pricing;
  }

  static async getOperations(): Promise<OperationsSettings> {
    return (await SettingsService.getOrEmpty()).operations;
  }

  static async getContent(): Promise<ContentSettings> {
    return (await SettingsService.getOrEmpty()).content;
  }

  static async getThemeAccentColor(): Promise<string | null> {
    const settings = await SettingsService.get();
    return resolveThemeAccentColor(settings);
  }

  // ─── Future integration placeholders ─────────────────────────────────────

  /** @placeholder Admin module — persist settings */
  static async update(data: BusinessSettings): Promise<BusinessSettings> {
    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    const merged: BusinessSettings = {
      ...data,
      branding: {
        ...data.branding,
        logoUrl: normalizeAppMediaUrl(data.branding.logoUrl),
        faviconUrl: normalizeAppMediaUrl(data.branding.faviconUrl),
      },
      metadata: {
        version: Math.max(0, (data.metadata?.version ?? 0) + 1),
        updatedAt: now,
        language: data.metadata?.language ?? null,
      },
    };

    if (supabase) {
      const payload = {
        id: SETTINGS_RECORD_ID,
        data: merged,
        version: merged.metadata.version,
        updated_at: now,
      };

      const { data: row, error } = await supabase
        .from("business_settings")
        .upsert(payload, { onConflict: "id" })
        .select("data")
        .single();

      if (error) throw new Error(error.message);
      const parsed = parseBusinessSettings(row?.data);
      if (!parsed) throw new Error("Failed to parse saved settings");
      return parsed;
    }

    const record = await prisma.businessSettings.upsert({
      where: { id: SETTINGS_RECORD_ID },
      create: {
        id: SETTINGS_RECORD_ID,
        data: merged,
        version: merged.metadata.version,
        updatedAt: new Date(now),
      },
      update: {
        data: merged,
        version: merged.metadata.version,
        updatedAt: new Date(now),
      },
    });

    const parsed = parseBusinessSettings(record.data);
    if (!parsed) throw new Error("Failed to parse saved settings");
    return parsed;
  }

  /** @placeholder Onboarding — seed initial settings */
  static async seed(_data: BusinessSettings): Promise<BusinessSettings> {
    void _data;
    throw new Error("SettingsService.seed is not yet implemented");
  }
}

/** @deprecated Use SettingsService */
export const BusinessSettingsService = SettingsService;
