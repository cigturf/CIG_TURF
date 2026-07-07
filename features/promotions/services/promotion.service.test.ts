import { resolveEffectiveStatus } from "@/features/promotions/services/promotion.service";
import type { PromotionRecord, PromotionStatus } from "@/features/promotions/types";
import { describe, expect, it } from "vitest";

function at(iso: string) {
  return new Date(iso);
}

describe("resolveEffectiveStatus", () => {
  it("returns draft and archived unchanged", () => {
    const base: Pick<PromotionRecord, "status" | "startAt" | "endAt"> = {
      status: "draft",
      startAt: null,
      endAt: null,
    };
    expect(resolveEffectiveStatus(base)).toBe("draft");
    expect(resolveEffectiveStatus({ ...base, status: "archived" })).toBe("archived");
  });

  it("publishes scheduled content after start time", () => {
    const record = {
      status: "scheduled" as PromotionStatus,
      startAt: "2026-08-01T09:00:00.000Z",
      endAt: "2026-08-10T23:59:00.000Z",
    };
    expect(resolveEffectiveStatus(record, at("2026-08-05T12:00:00.000Z"))).toBe("published");
  });

  it("expires content after end time", () => {
    const record = {
      status: "published" as PromotionStatus,
      startAt: "2026-08-01T09:00:00.000Z",
      endAt: "2026-08-10T23:59:00.000Z",
    };
    expect(resolveEffectiveStatus(record, at("2026-08-11T00:00:00.000Z"))).toBe("expired");
  });
});
