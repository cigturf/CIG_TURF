import { describe, expect, it, beforeEach } from "vitest";

import type { BookingSelectionState, BookingSummary } from "@/features/booking/types";
import {
  bookingSessionToSelection,
  clearBookingSession,
  readBookingSession,
  saveBookingSession,
  updateBookingSessionProfile,
} from "@/features/booking/utils/booking-session";
import { BOOKING_SESSION_KEY } from "@/features/booking/types/booking-session.types";

const selection: BookingSelectionState = {
  dateIso: "2026-07-10",
  selectedSlotIds: ["2026-07-10-1080", "2026-07-10-1110"],
};

const summary: BookingSummary = {
  timeRange: "6:00 pm – 7:00 pm",
  slotCount: 2,
  totalDurationMinutes: 60,
  totalDurationLabel: "1 hr",
  totalPrice: 1200,
  advanceAmount: 200,
  remainingAmount: 1000,
};

describe("booking session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and restores booking session", () => {
    saveBookingSession(selection, summary);
    const stored = readBookingSession();

    expect(stored?.dateIso).toBe("2026-07-10");
    expect(stored?.selectedSlotIds).toEqual(selection.selectedSlotIds);
    expect(stored?.timeRange).toBe("6:00 pm – 7:00 pm");
    expect(stored?.totalPrice).toBe(1200);
    expect(stored?.advanceAmount).toBe(200);
    expect(stored?.remainingAmount).toBe(1000);
  });

  it("converts session back to selection state", () => {
    saveBookingSession(selection, summary);
    const stored = readBookingSession();
    expect(bookingSessionToSelection(stored!)).toEqual(selection);
  });

  it("clears booking session", () => {
    saveBookingSession(selection, summary);
    clearBookingSession();
    expect(sessionStorage.getItem(BOOKING_SESSION_KEY)).toBeNull();
  });

  it("updates profile on booking session", () => {
    saveBookingSession(selection, summary);
    updateBookingSessionProfile({
      name: "Player",
      phone: "9876543210",
      email: "player@example.com",
    });

    const stored = readBookingSession();
    expect(stored?.profile).toEqual({
      name: "Player",
      phone: "9876543210",
      email: "player@example.com",
    });
  });
});
