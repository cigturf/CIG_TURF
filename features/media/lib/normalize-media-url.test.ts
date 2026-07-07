import { describe, expect, it } from "vitest";

import { normalizeAppMediaUrl } from "./normalize-media-url";

describe("normalizeAppMediaUrl", () => {
  it("returns null for empty values", () => {
    expect(normalizeAppMediaUrl(null)).toBeNull();
    expect(normalizeAppMediaUrl("")).toBeNull();
    expect(normalizeAppMediaUrl("   ")).toBeNull();
  });

  it("keeps relative media paths", () => {
    expect(normalizeAppMediaUrl("/api/media/abc-123")).toBe("/api/media/abc-123");
  });

  it("strips origin from absolute localhost media URLs", () => {
    expect(
      normalizeAppMediaUrl("http://localhost:3001/api/media/ab449454-6d6f-42a5-b058-88e82ae06074"),
    ).toBe("/api/media/ab449454-6d6f-42a5-b058-88e82ae06074");
  });

  it("preserves non-media URLs", () => {
    expect(normalizeAppMediaUrl("https://example.com/logo.png")).toBe(
      "https://example.com/logo.png",
    );
  });
});
