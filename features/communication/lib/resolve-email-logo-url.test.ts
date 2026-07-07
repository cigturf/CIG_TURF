import { afterEach, describe, expect, it, vi } from "vitest";

import { toAbsoluteAppUrl } from "@/features/communication/lib/resolve-email-logo-url";

vi.mock("@/config/app.config", () => ({
  getAppConfig: () => ({
    url: "https://book.chandanaindoor.com",
    envDisplayName: "CIG",
    isDevelopment: false,
    isProduction: true,
  }),
}));

describe("toAbsoluteAppUrl", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prefixes relative media paths with the app origin", () => {
    expect(toAbsoluteAppUrl("/api/media/abc-123")).toBe(
      "https://book.chandanaindoor.com/api/media/abc-123",
    );
  });

  it("rewrites localhost media URLs to the public app origin", () => {
    expect(
      toAbsoluteAppUrl("http://localhost:3001/api/media/ab449454-6d6f-42a5-b058-88e82ae06074"),
    ).toBe("https://book.chandanaindoor.com/api/media/ab449454-6d6f-42a5-b058-88e82ae06074");
  });

  it("preserves external https image URLs", () => {
    expect(toAbsoluteAppUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("prefixes static branding assets", () => {
    expect(toAbsoluteAppUrl("/branding/logo-dark.png")).toBe(
      "https://book.chandanaindoor.com/branding/logo-dark.png",
    );
  });
});
