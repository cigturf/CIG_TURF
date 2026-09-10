import { describe, expect, it } from "vitest";

import { buildWhatsAppShareLink } from "@/features/booking/lib/whatsapp-share";

describe("buildWhatsAppShareLink", () => {
  it("prepends the Indian country code to a bare 10-digit number", () => {
    const url = buildWhatsAppShareLink("hello", "9996910306");
    expect(url).toBe("https://wa.me/919996910306?text=hello");
  });

  it("strips formatting characters before checking the digit count", () => {
    const url = buildWhatsAppShareLink("hello", "+91 99969 10306");
    expect(url).toBe("https://wa.me/919996910306?text=hello");
  });

  it("leaves a number that already has a country code untouched", () => {
    const url = buildWhatsAppShareLink("hello", "919996910306");
    expect(url).toBe("https://wa.me/919996910306?text=hello");
  });

  it("falls back to WhatsApp's contact picker when no phone is given", () => {
    expect(buildWhatsAppShareLink("hello", undefined)).toBe("https://wa.me/?text=hello");
    expect(buildWhatsAppShareLink("hello", null)).toBe("https://wa.me/?text=hello");
    expect(buildWhatsAppShareLink("hello", "")).toBe("https://wa.me/?text=hello");
  });
});
