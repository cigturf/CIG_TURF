import { describe, expect, it } from "vitest";

import { buildAuthContinueUrl } from "@/features/auth/utils/redirect";
import { AUTH_ROUTES } from "@/features/auth/types";

describe("post-auth redirect helpers", () => {
  it("builds a server-side continue URL without exposing admin status", () => {
    expect(buildAuthContinueUrl(AUTH_ROUTES.customer)).toBe(
      "/api/auth/continue?next=%2Fcustomer",
    );
    expect(buildAuthContinueUrl(null)).toBe("/api/auth/continue?next=%2Fcustomer");
  });
});
