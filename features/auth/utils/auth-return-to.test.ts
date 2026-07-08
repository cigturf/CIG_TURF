import { describe, expect, it } from "vitest";

import { AUTH_ROUTES } from "@/features/auth/types";
import {
  resolveAuthReturnPath,
  sanitizeAuthReturnPath,
} from "@/features/auth/utils/auth-return-to.shared";

describe("sanitizeAuthReturnPath", () => {
  it("accepts internal paths", () => {
    expect(sanitizeAuthReturnPath("/book/details")).toBe("/book/details");
  });

  it("rejects external URLs", () => {
    expect(sanitizeAuthReturnPath("https://evil.com")).toBeNull();
    expect(sanitizeAuthReturnPath("//evil.com")).toBeNull();
  });
});

describe("resolveAuthReturnPath", () => {
  it("falls back when path is invalid", () => {
    expect(resolveAuthReturnPath(null)).toBe(AUTH_ROUTES.customer);
  });
});
