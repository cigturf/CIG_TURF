import { describe, expect, it } from "vitest";

import {
  AUDIT_RETENTION_DAYS,
  clampAuditDateRange,
  getAuditRetentionCutoffIso,
} from "@/features/audit/config/audit-retention";

describe("audit retention", () => {
  const now = new Date("2026-07-07T12:00:00");

  it("keeps a three-day window", () => {
    expect(AUDIT_RETENTION_DAYS).toBe(3);
    expect(getAuditRetentionCutoffIso(now)).toBe("2026-07-05");
  });

  it("clamps query ranges to the retention window", () => {
    const clamped = clampAuditDateRange("2026-06-01", "2026-07-07", now);
    expect(clamped.from).toBe("2026-07-05");
    expect(clamped.to).toBe("2026-07-07");
  });
});
