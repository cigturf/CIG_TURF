import { describe, expect, it } from "vitest";

import { resolveGoogleMapsEmbedUrl } from "@/features/landing/lib/google-maps-embed";

describe("resolveGoogleMapsEmbedUrl", () => {
  it("uses existing embed URLs as-is", () => {
    const url = "https://www.google.com/maps/embed?pb=abc123";
    expect(resolveGoogleMapsEmbedUrl(url, null)).toBe(url);
  });

  it("builds embed from full address for short share links", () => {
    const embed = resolveGoogleMapsEmbedUrl(
      "https://maps.app.goo.gl/49zVPI",
      "Chandna Indoor Ground, Saharanpur",
    );
    expect(embed).toContain("maps.google.com/maps?");
    expect(embed).toContain("Chandna");
    expect(embed).toContain("Saharanpur");
    expect(embed).toContain("output=embed");
  });

  it("returns null for short links without an address", () => {
    expect(resolveGoogleMapsEmbedUrl("https://maps.app.goo.gl/49zVPI", null)).toBeNull();
  });
});
