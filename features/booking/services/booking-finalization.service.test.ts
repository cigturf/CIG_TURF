import { describe, expect, it, vi, beforeEach } from "vitest";

import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
  createBookingRecord: vi.fn(),
  deleteBookingById: vi.fn(),
}));

vi.mock("@/features/booking/services/booked-slot.repository", () => ({
  getUnavailableSlotIds: vi.fn(),
  reserveBookedSlots: vi.fn(),
  releaseBookedSlotsForBooking: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  getBookingSessionById: vi.fn(),
  isBookingSessionExpired: vi.fn(),
  updateBookingSessionStatus: vi.fn(),
}));

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaidPaymentBySessionId: vi.fn(),
}));

vi.mock("@/features/payments/services/payment-refund.service", () => ({
  refundOnlineAdvanceWithoutBooking: vi.fn(),
}));

vi.mock("@/features/admin/bookings/services/booking-payment.repository", () => ({
  createBookingPaymentRecord: vi.fn(),
  listPaymentRecordsForBooking: vi.fn(),
}));

vi.mock("@/features/booking/services/booking-reference.service", () => ({
  generateBookingReference: vi.fn().mockResolvedValue("CIG-TEST-001"),
}));

vi.mock("@/features/communication/services/communication-dispatcher", () => ({
  dispatchBookingConfirmedEmails: vi.fn(),
  publishCommunicationEvent: vi.fn(),
}));

import {
  createBookingRecord,
  deleteBookingById,
  getBookingBySessionId,
} from "@/features/booking/services/booking.repository";
import {
  getUnavailableSlotIds,
  releaseBookedSlotsForBooking,
  reserveBookedSlots,
} from "@/features/booking/services/booked-slot.repository";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import {
  getBookingSessionById,
  isBookingSessionExpired,
} from "@/features/payments/services/booking-session.repository";
import { getPaidPaymentBySessionId } from "@/features/payments/services/payment.repository";
import { refundOnlineAdvanceWithoutBooking } from "@/features/payments/services/payment-refund.service";
import { dispatchBookingConfirmedEmails } from "@/features/communication/services/communication-dispatcher";
import {
  createBookingPaymentRecord,
  listPaymentRecordsForBooking,
} from "@/features/admin/bookings/services/booking-payment.repository";

const baseSession = {
  id: "session-1",
  userId: "user-1",
  selectedDate: "2026-07-10",
  selectedSlots: ["2026-07-10-1080"],
  timeRange: "6:00 pm – 6:30 pm",
  slotCount: 1,
  totalDurationMinutes: 30,
  totalDurationLabel: "30 min",
  totalPrice: 600,
  advanceAmount: 200,
  remainingAmount: 400,
  profileName: "Test User",
  profilePhone: "9876543210",
  profileEmail: "test@example.com",
  status: "payment_completed" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const basePayment = {
  id: "pay-1",
  bookingSessionId: "session-1",
  userId: "user-1",
  razorpayOrderId: "order_1",
  razorpayPaymentId: "pay_razorpay",
  amount: 20000,
  currency: "INR",
  status: "paid" as const,
  paymentMethod: "upi",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseBooking = {
  id: "booking-1",
  bookingReference: "CIG-TEST-001",
  userId: "user-1",
  bookingSessionId: "session-1",
  paymentId: "pay-1",
  bookingDate: "2026-07-10",
  startTime: "18:00",
  endTime: "18:30",
  selectedSlots: ["2026-07-10-1080"],
  durationMinutes: 30,
  totalPrice: 600,
  advancePaid: 200,
  remainingAmount: 400,
  status: "confirmed" as const,
  source: "online" as const,
  notes: null,
  cancellationReason: null,
  arrivedAt: null,
  matchStartedAt: null,
  matchCompletedAt: null,
  customerName: "Test User",
  customerPhone: "9876543210",
  customerEmail: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("finalizeBookingFromSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue(baseSession);
    vi.mocked(isBookingSessionExpired).mockReturnValue(false);
    vi.mocked(getPaidPaymentBySessionId).mockResolvedValue(basePayment);
    vi.mocked(getUnavailableSlotIds).mockResolvedValue([]);
    vi.mocked(reserveBookedSlots).mockResolvedValue({ success: true });
    vi.mocked(releaseBookedSlotsForBooking).mockResolvedValue([]);
    vi.mocked(deleteBookingById).mockResolvedValue(undefined);
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([]);
    vi.mocked(createBookingRecord).mockResolvedValue({ booking: baseBooking, isNew: true });
  });

  it("is idempotent when booking already exists for session", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue(baseBooking);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(true);
    expect(createBookingRecord).not.toHaveBeenCalled();
    expect(releaseSlotHoldsForSession).toHaveBeenCalledWith("session-1");
  });

  it("refunds and fails when slots are unavailable after payment", async () => {
    vi.mocked(getUnavailableSlotIds).mockResolvedValue(["2026-07-10-1080"]);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("slots_unavailable");
    }
    expect(refundOnlineAdvanceWithoutBooking).toHaveBeenCalled();
    expect(releaseSlotHoldsForSession).toHaveBeenCalledWith("session-1");
  });

  it("refunds when session expired but payment was captured", async () => {
    vi.mocked(isBookingSessionExpired).mockReturnValue(true);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(false);
    expect(refundOnlineAdvanceWithoutBooking).toHaveBeenCalled();
    expect(createBookingRecord).not.toHaveBeenCalled();
  });

  it("does not duplicate advance ledger on repeated finalize", async () => {
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([
      {
        id: "ledger-1",
        bookingId: "booking-1",
        type: "advance",
        amount: 200,
        method: "online",
        collectedBy: null,
        notes: null,
        referenceNumber: "pay_razorpay",
        createdAt: new Date(),
      },
    ]);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(true);
    expect(createBookingPaymentRecord).not.toHaveBeenCalled();
  });

  it("returns existing booking when concurrent finalize wins race", async () => {
    const concurrentBooking = { ...baseBooking, id: "booking-2" };
    vi.mocked(createBookingRecord).mockResolvedValue({
      booking: { ...baseBooking, id: "booking-orphan" },
      isNew: true,
    });
    vi.mocked(getBookingBySessionId)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrentBooking);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.booking.id).toBe("booking-2");
    }
    expect(reserveBookedSlots).not.toHaveBeenCalled();
  });

  it("does not refund when reserve fails but booking was already confirmed", async () => {
    vi.mocked(reserveBookedSlots).mockResolvedValue({
      success: false,
      conflictingSlotIds: ["2026-07-10-1080"],
    });
    vi.mocked(getBookingBySessionId)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(baseBooking);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.booking.id).toBe("booking-1");
    }
    expect(refundOnlineAdvanceWithoutBooking).not.toHaveBeenCalled();
    expect(deleteBookingById).toHaveBeenCalled();
  });

  it("does not send emails when booking record already existed for session", async () => {
    vi.mocked(createBookingRecord).mockResolvedValue({ booking: baseBooking, isNew: false });

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(true);
    expect(dispatchBookingConfirmedEmails).not.toHaveBeenCalled();
    expect(reserveBookedSlots).not.toHaveBeenCalled();
    expect(releaseSlotHoldsForSession).toHaveBeenCalledWith("session-1");
  });

  it("does not refund on expired session when booking already exists", async () => {
    vi.mocked(isBookingSessionExpired).mockReturnValue(true);
    vi.mocked(getBookingBySessionId).mockResolvedValue(baseBooking);

    const result = await finalizeBookingFromSession({
      bookingSessionId: "session-1",
      userId: "user-1",
      venueName: "CIG",
    });

    expect(result.success).toBe(true);
    expect(refundOnlineAdvanceWithoutBooking).not.toHaveBeenCalled();
    expect(createBookingRecord).not.toHaveBeenCalled();
  });
});
