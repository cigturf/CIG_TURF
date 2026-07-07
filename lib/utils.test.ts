import { describe, expect, it } from "vitest";

import { getAppConfig } from "@/config/app.config";
import { BREAKPOINTS } from "@/config/breakpoints.config";
import { THEME_MODES } from "@/config/theme.config";
import { SETTINGS_CATEGORIES } from "@/features/business-settings/types";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { toPublicBusinessSettings } from "@/features/business-settings/lib/parse";
import { DURATION, EASING } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";
import { formatCurrency, slugify } from "@/utils";
import { getDeviceType, isBreakpointUp } from "@/utils/responsive";
import { isDarkTheme, isSystemTheme } from "@/utils/color-mode";

describe("config", () => {
  it("exposes app config from environment", () => {
    const app = getAppConfig();
    expect(app.url).toBeTruthy();
    expect(typeof app.isDevelopment).toBe("boolean");
  });

  it("defines mobile-first breakpoints", () => {
    expect(BREAKPOINTS.xs).toBeLessThan(BREAKPOINTS.sm);
    expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md);
  });

  it("supports light, dark, and system themes", () => {
    expect(THEME_MODES).toEqual(["light", "dark", "system"]);
  });
});

describe("business settings", () => {
  it("creates empty settings without hardcoded business values", () => {
    const settings = createEmptyBusinessSettings();
    expect(settings.branding.businessName).toBeNull();
    expect(settings.branding.themeAccentColor).toBeNull();
    expect(settings.media.heroVideos).toBeNull();
    expect(settings.media.gallery).toBeNull();
    expect(settings.contact.contactNumbers).toBeNull();
    expect(settings.contact.whatsappNumber).toBeNull();
    expect(settings.emails.bookingNotificationEmails).toBeNull();
    expect(settings.booking.rules).toBeNull();
    expect(settings.pricing.tiers).toBeNull();
    expect(settings.content.faq).toBeNull();
  });

  it("covers all settings categories", () => {
    expect(SETTINGS_CATEGORIES).toContain("branding");
    expect(SETTINGS_CATEGORIES).toContain("media");
    expect(SETTINGS_CATEGORIES).toContain("emails");
    expect(SETTINGS_CATEGORIES).toContain("content");
  });

  it("excludes private emails from public settings", () => {
    const empty = createEmptyBusinessSettings();
    const publicSettings = toPublicBusinessSettings(empty);
    expect(publicSettings).not.toHaveProperty("emails");
    expect(publicSettings.branding).toBeDefined();
    expect(publicSettings.media).toBeDefined();
    expect(publicSettings.content).toBeDefined();
  });
});

describe("design system motion", () => {
  it("uses premium easing presets", () => {
    expect(EASING.premium).toHaveLength(4);
    expect(DURATION.normal).toBeGreaterThan(0);
  });
});

describe("responsive utils", () => {
  it("classifies device type mobile-first", () => {
    expect(getDeviceType(375)).toBe("mobile");
    expect(getDeviceType(800)).toBe("tablet");
    expect(getDeviceType(1280)).toBe("desktop");
  });

  it("checks breakpoint up", () => {
    expect(isBreakpointUp(640, "sm")).toBe(true);
    expect(isBreakpointUp(500, "sm")).toBe(false);
  });
});

describe("color mode utils", () => {
  it("detects dark theme", () => {
    expect(isDarkTheme("dark")).toBe(true);
    expect(isDarkTheme("light")).toBe(false);
  });

  it("detects system theme preference", () => {
    expect(isSystemTheme("system")).toBe(true);
    expect(isSystemTheme("dark")).toBe(false);
  });
});

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("formats currency in INR", () => {
    expect(formatCurrency(1500)).toContain("1,500");
  });

  it("slugifies strings", () => {
    expect(slugify("Chandna Indoor Ground")).toBe("chandna-indoor-ground");
  });
});
