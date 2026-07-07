import { describe, expect, it } from "vitest";

import { resolveReportDateRange } from "@/features/admin/reports/lib/report-date-range";

describe("resolveReportDateRange", () => {
  const now = new Date("2026-07-07T10:00:00");

  it("resolves today", () => {
    const range = resolveReportDateRange("today", undefined, undefined, now);
    expect(range).toEqual({
      preset: "today",
      from: "2026-07-07",
      to: "2026-07-07",
      label: "Today",
    });
  });

  it("resolves last 7 days", () => {
    const range = resolveReportDateRange("last_7_days", undefined, undefined, now);
    expect(range.from).toBe("2026-07-01");
    expect(range.to).toBe("2026-07-07");
  });

  it("resolves previous month", () => {
    const range = resolveReportDateRange("previous_month", undefined, undefined, now);
    expect(range.from).toBe("2026-06-01");
    expect(range.to).toBe("2026-06-30");
  });

  it("resolves custom range", () => {
    const range = resolveReportDateRange("custom", "2026-07-01", "2026-07-05", now);
    expect(range.from).toBe("2026-07-01");
    expect(range.to).toBe("2026-07-05");
    expect(range.label).toBe("Custom Range");
  });
});
