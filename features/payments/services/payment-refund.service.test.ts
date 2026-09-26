import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: { server: { RAZORPAY_KEY_ID: "rzp_test_id", RAZORPAY_KEY_SECRET: "rzp_test_secret" } },
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  getBookingSessionById: vi.fn(),
}));

vi.mock("@/features/communication/services/communication-dispatcher", () => ({
  dispatchBookingRefundedEmails: vi.fn(),
}));

vi.mock("razorpay", () => ({
  default: vi.fn().mockImplementation(function RazorpayMock() {
    return {
      payments: {
        refund: vi.fn().mockResolvedValue({ id: "rfnd_test" }),
      },
    };
  }),
}));

import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { getBookingSessionById } from "@/features/payments/services/booking-session.repository";
import { dispatchBookingRefundedEmails } from "@/features/communication/services/communication-dispatcher";
import { refundOnlineAdvanceWithoutBooking } from "@/features/payments/services/payment-refund.service";

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

const baseSession = {
  id: "session-1",
  userId: "user-1",
  selectedDate: "2026-09-20",
  selectedSlots: ["slot-1"],
  timeRange: "08:00 – 08:30",
  slotCount: 1,
  totalDurationMinutes: 30,
  totalDurationLabel: "30 min",
  totalPrice: 500,
  advanceAmount: 500,
  remainingAmount: 0,
  profileName: "Test Customer",
  profilePhone: "9990001111",
  profileEmail: "customer@example.com",
  status: "payment_completed" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("refundOnlineAdvanceWithoutBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue(baseSession);
  });

  it("skips refund when a confirmed booking already exists for the session", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue({
      id: "booking-1",
      bookingSessionId: "session-1",
    } as Awaited<ReturnType<typeof getBookingBySessionId>>);

    const result = await refundOnlineAdvanceWithoutBooking({
      payment: basePayment,
      reason: "Slots unavailable after payment",
    });

    expect(result).toBe(false);
    expect(dispatchBookingRefundedEmails).not.toHaveBeenCalled();
  });

  it("refunds and notifies the customer and owner on success", async () => {
    const result = await refundOnlineAdvanceWithoutBooking({
      payment: basePayment,
      reason: "Slots unavailable after payment",
    });

    expect(result).toBe(true);
    expect(dispatchBookingRefundedEmails).toHaveBeenCalledWith({
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      attemptedDate: "2026-09-20",
      attemptedTime: "08:00 – 08:30",
      amountRefunded: 200,
      paymentReference: "pay_razorpay",
      reason: "Slots unavailable after payment",
    });
  });

  it("does not notify when the session record is missing", async () => {
    vi.mocked(getBookingSessionById).mockResolvedValue(null);

    const result = await refundOnlineAdvanceWithoutBooking({
      payment: basePayment,
      reason: "Slots unavailable after payment",
    });

    expect(result).toBe(true);
    expect(dispatchBookingRefundedEmails).not.toHaveBeenCalled();
  });
});
