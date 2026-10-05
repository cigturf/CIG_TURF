import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingById: vi.fn(),
  updateBookingRecord: vi.fn(),
}));

vi.mock("@/features/admin/bookings/services/booking-payment.repository", () => ({
  listPaymentRecordsForBooking: vi.fn(),
  createBookingPaymentRecord: vi.fn(),
  updateBookingPaymentRecordAmount: vi.fn(),
}));

vi.mock("@/features/admin/bookings/services/booking-audit.repository", () => ({
  createBookingAuditLog: vi.fn(),
  listAuditLogsForBooking: vi.fn(),
}));

import { updateAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { getBookingById, updateBookingRecord } from "@/features/booking/services/booking.repository";
import {
  createBookingPaymentRecord,
  listPaymentRecordsForBooking,
  updateBookingPaymentRecordAmount,
} from "@/features/admin/bookings/services/booking-payment.repository";
import { createBookingAuditLog, listAuditLogsForBooking } from "@/features/admin/bookings/services/booking-audit.repository";

const baseBooking = {
  id: "booking-1",
  bookingReference: "CIG-TEST-001",
  userId: "user-1",
  bookingSessionId: "session-1",
  paymentId: "pay-1",
  bookingDate: "2026-09-29",
  startTime: "8:30 pm",
  endTime: "10:00 pm",
  selectedSlots: ["2026-09-29-1230", "2026-09-29-1260", "2026-09-29-1290"],
  durationMinutes: 90,
  totalPrice: 1350,
  advancePaid: 200,
  remainingAmount: 1150,
  status: "confirmed" as const,
  source: "online" as const,
  notes: null,
  cancellationReason: null,
  arrivedAt: null,
  matchStartedAt: null,
  matchCompletedAt: null,
  customerName: "Rajat Aggarwal",
  customerPhone: "8130122712",
  customerEmail: "aggarwal.rajat2308@gmail.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const genuineRazorpayAdvance = {
  id: "advance-1",
  bookingId: "booking-1",
  type: "advance" as const,
  amount: 200,
  method: "online" as const,
  collectedBy: null,
  notes: "Online booking advance",
  referenceNumber: "pay_ThkvYmwU4Z0A0S",
  createdAt: new Date(),
};

const actor = { userId: "admin-1", email: "cigturf@gmail.com" };

describe("updateAdminBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingById).mockResolvedValue(baseBooking);
    vi.mocked(updateBookingRecord).mockResolvedValue(baseBooking);
    vi.mocked(listAuditLogsForBooking).mockResolvedValue([]);
  });

  it("never mutates a genuine Razorpay capture's own amount, even when increasing the advance", async () => {
    // Regression: "Edit Amounts" used to call updateBookingPaymentRecordAmount
    // unconditionally, silently overwriting a real captured Razorpay payment's
    // ledger amount (this is exactly how a genuine ₹200 capture became a
    // fabricated ₹400 "advance" on a real booking). Increasing the advance
    // must split: the Razorpay row stays untouched, and a new, separately
    // attributed row covers only the difference.
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([genuineRazorpayAdvance]);

    await updateAdminBooking(
      "booking-1",
      { totalPrice: 1800, advancePaid: 400, advanceAdjustmentMethod: "upi" },
      actor,
    );

    expect(updateBookingPaymentRecordAmount).not.toHaveBeenCalled();
    expect(createBookingPaymentRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: "advance", amount: 200, method: "upi", collectedBy: "admin-1" }),
    );
    expect(updateBookingRecord).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({ totalPrice: 1800, advancePaid: 400, remainingAmount: 1400 }),
    );
  });

  it("refuses to reduce the advance below what Razorpay genuinely collected", async () => {
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([genuineRazorpayAdvance]);

    await expect(
      updateAdminBooking("booking-1", { advancePaid: 100 }, actor),
    ).rejects.toThrow(/Razorpay/);

    expect(updateBookingPaymentRecordAmount).not.toHaveBeenCalled();
    expect(createBookingPaymentRecord).not.toHaveBeenCalled();
    expect(updateBookingRecord).not.toHaveBeenCalled();
  });

  it("adjusts the existing admin-recorded top-up instead of creating a duplicate one", async () => {
    // A booking that already has both a genuine ₹200 Razorpay row and a
    // previously-added ₹50 admin top-up; editing the advance again should
    // resize the top-up, not touch Razorpay's row or create a third record.
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([
      genuineRazorpayAdvance,
      {
        id: "advance-2",
        bookingId: "booking-1",
        type: "advance" as const,
        amount: 50,
        method: "upi" as const,
        collectedBy: "admin-1",
        notes: "Additional advance beyond the ₹200 Razorpay collected",
        referenceNumber: null,
        createdAt: new Date(),
      },
    ]);

    await updateAdminBooking("booking-1", { advancePaid: 300 }, { ...actor, userId: "admin-1" });

    expect(updateBookingPaymentRecordAmount).toHaveBeenCalledWith("advance-2", 100);
    expect(createBookingPaymentRecord).not.toHaveBeenCalled();
  });

  it("allows editing the advance when it was admin-recorded, not a Razorpay capture", async () => {
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([
      { ...genuineRazorpayAdvance, collectedBy: "admin-1", method: "cash" },
    ]);

    await updateAdminBooking("booking-1", { totalPrice: 1800, advancePaid: 400 }, actor);

    expect(updateBookingPaymentRecordAmount).toHaveBeenCalledWith("advance-1", 400);
    expect(createBookingAuditLog).toHaveBeenCalled();
    expect(updateBookingRecord).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({ totalPrice: 1800, advancePaid: 400, remainingAmount: 1400 }),
    );
  });

  it("attributes a newly created advance record to the editing admin, not as a genuine Razorpay payment", async () => {
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([]);

    await updateAdminBooking("booking-1", { advancePaid: 300 }, actor);

    expect(createBookingPaymentRecord).toHaveBeenCalledWith(
      expect.objectContaining({ collectedBy: "admin-1" }),
    );
  });

  it("still allows editing total price alone without touching the advance", async () => {
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([genuineRazorpayAdvance]);

    await updateAdminBooking("booking-1", { totalPrice: 1500 }, actor);

    expect(updateBookingPaymentRecordAmount).not.toHaveBeenCalled();
    expect(updateBookingRecord).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({ totalPrice: 1500, advancePaid: 200, remainingAmount: 1300 }),
    );
  });
});
