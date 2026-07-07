import { describe, expect, it } from "vitest";

import {
  formatAdminRole,
  hasAdminPermission,
} from "@/features/admin/config/admin-permissions";

describe("admin permissions", () => {
  it("grants owner all permissions", () => {
    expect(hasAdminPermission("owner", "settings.manage")).toBe(true);
  });

  it("restricts staff to limited permissions", () => {
    expect(hasAdminPermission("staff", "bookings.view")).toBe(true);
    expect(hasAdminPermission("staff", "settings.manage")).toBe(false);
  });

  it("formats role labels", () => {
    expect(formatAdminRole("owner")).toBe("Owner");
  });
});
