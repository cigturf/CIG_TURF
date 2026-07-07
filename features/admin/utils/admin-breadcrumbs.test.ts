import { describe, expect, it } from "vitest";

import { buildAdminBreadcrumbs } from "@/features/admin/utils/admin-breadcrumbs";

describe("buildAdminBreadcrumbs", () => {
  it("returns dashboard for /admin", () => {
    expect(buildAdminBreadcrumbs("/admin")).toEqual([{ label: "Dashboard" }]);
  });

  it("returns nested crumbs for section routes", () => {
    expect(buildAdminBreadcrumbs("/admin/bookings")).toEqual([
      { label: "Dashboard", href: "/admin" },
      { label: "Bookings" },
    ]);
  });
});
