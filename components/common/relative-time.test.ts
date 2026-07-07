import { describe, expect, it } from "vitest";

import {
  formatRelativeTime,
  formatStableTimestamp,
} from "@/components/common/relative-time";

describe("formatStableTimestamp", () => {
  it("uses a fixed timezone for deterministic SSR output", () => {
    const label = formatStableTimestamp("2026-07-07T10:30:00.000Z");
    expect(label).toContain("Jul");
    expect(label).toMatch(/\d/);
  });
});

describe("formatRelativeTime", () => {
  it("formats recent timestamps", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
  });
});
