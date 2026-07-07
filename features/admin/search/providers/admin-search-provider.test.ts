import { describe, expect, it } from "vitest";

import {
  filterAdminSearchResults,
  searchAdminGlobal,
} from "@/features/admin/search/providers/admin-search-provider";
import { ADMIN_SEARCH_ITEMS } from "@/features/admin/search/config/admin-search-items";

describe("admin search provider", () => {
  it("returns all items for empty query", () => {
    expect(searchAdminGlobal("")).toHaveLength(ADMIN_SEARCH_ITEMS.length);
  });

  it("filters admin pages by label", () => {
    const results = searchAdminGlobal("bookings");
    expect(results.some((item) => item.label === "Bookings")).toBe(true);
  });

  it("supports placeholder customer search scope", () => {
    const results = filterAdminSearchResults(ADMIN_SEARCH_ITEMS, "customer");
    expect(results.some((item) => item.scope === "customers")).toBe(true);
  });
});
