import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/services/booked-slot.repository", () => ({
  getBookedSlotIdsForDate: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/slots/services/slot-management.repository", () => ({
  upsertSlotBlock: vi.fn().mockResolvedValue(undefined),
  deleteSlotBlock: vi.fn().mockResolvedValue(undefined),
  deleteSlotHoliday: vi.fn().mockResolvedValue(undefined),
  getSlotAvailabilitySnapshot: vi.fn(),
  getSlotHoliday: vi.fn(),
  upsertSlotHoliday: vi.fn(),
}));

vi.mock("@/features/communication/services/communication-dispatcher", () => ({
  dispatchSlotsBlockedEmail: vi.fn().mockResolvedValue(undefined),
  dispatchSlotsUnblockedEmail: vi.fn().mockResolvedValue(undefined),
}));

import { getBookedSlotIdsForDate } from "@/features/booking/services/booked-slot.repository";
import { upsertSlotBlock } from "@/features/slots/services/slot-management.repository";
import {
  dispatchSlotsBlockedEmail,
  dispatchSlotsUnblockedEmail,
} from "@/features/communication/services/communication-dispatcher";
import { blockSlots, unblockSlots } from "@/features/slots/services/slot-management.service";

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("slot-management.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookedSlotIdsForDate).mockResolvedValue([]);
  });

  it("emails the owner with a reason and only the slots that were actually blocked", async () => {
    vi.mocked(getBookedSlotIdsForDate).mockResolvedValue(["2026-09-27-0"]);

    const result = await blockSlots({
      items: [{ bookingDate: "2026-09-27", slotIds: ["2026-09-27-0", "2026-09-27-30"] }],
      state: "maintenance",
      reason: "Tournament",
    });

    // The already-booked slot is a conflict and must not be blocked or emailed.
    expect(result.conflicts).toEqual([{ bookingDate: "2026-09-27", slotId: "2026-09-27-0" }]);
    expect(result.blockedCount).toBe(1);
    expect(upsertSlotBlock).toHaveBeenCalledTimes(1);
    expect(upsertSlotBlock).toHaveBeenCalledWith(
      expect.objectContaining({ slotId: "2026-09-27-30", reason: "Tournament" }),
    );

    await flushMicrotasks();

    expect(dispatchSlotsBlockedEmail).toHaveBeenCalledTimes(1);
    const call = vi.mocked(dispatchSlotsBlockedEmail).mock.calls[0]![0];
    expect(call.state).toBe("maintenance");
    expect(call.reason).toBe("Tournament");
    expect(call.totalSlots).toBe(1);
    expect(call.dateSummaries).toHaveLength(1);
    expect(call.dateSummaries[0]!.value).toContain("12:30");
    expect(call.dateSummaries[0]!.value).not.toContain("12:00");
  });

  it("does not email the owner when every requested slot conflicts with an existing booking", async () => {
    vi.mocked(getBookedSlotIdsForDate).mockResolvedValue(["2026-09-27-0"]);

    await blockSlots({
      items: [{ bookingDate: "2026-09-27", slotIds: ["2026-09-27-0"] }],
      state: "blocked",
      reason: "Raining",
    });

    await flushMicrotasks();

    expect(dispatchSlotsBlockedEmail).not.toHaveBeenCalled();
  });

  it("emails the owner when blocked slots are released", async () => {
    await unblockSlots({
      items: [{ bookingDate: "2026-09-27", slotIds: ["2026-09-27-0", "2026-09-27-30"] }],
    });

    await flushMicrotasks();

    expect(dispatchSlotsUnblockedEmail).toHaveBeenCalledTimes(1);
    const call = vi.mocked(dispatchSlotsUnblockedEmail).mock.calls[0]![0];
    expect(call.totalSlots).toBe(2);
    expect(call.dateSummaries).toHaveLength(1);
  });
});
