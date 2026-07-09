import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/communication/lib/build-email-branding", () => ({
  loadEmailBrandingContext: vi.fn().mockResolvedValue({
    branding: {
      businessName: "CIG",
      logoUrl: null,
      phone: null,
      contactNumbers: [],
      whatsappNumbers: [],
      supportEmail: null,
      address: null,
      googleMapsLink: null,
      websiteUrl: null,
      socialInstagram: null,
      socialFacebook: null,
      fromName: "CIG",
      replyTo: null,
      accentColor: "#000",
      appUrl: "https://example.com",
    },
    communication: {
      fromName: "CIG",
      replyToEmail: null,
      ownerNotificationEmails: ["owner@example.com"],
      supportEmails: [],
      enableCustomerEmails: true,
      enableOwnerEmails: true,
    },
  }),
}));

vi.mock("@/features/communication/services/email-log.repository", () => ({
  createEmailLog: vi.fn(),
  hasBookingNotificationPendingOrSent: vi.fn(),
  hasSentTemplateRecently: vi.fn(),
  getEmailLogById: vi.fn(),
  updateEmailLogStatus: vi.fn(),
}));

vi.mock("@/features/communication/services/email-queue.service", () => ({
  queueEmailProcessing: vi.fn(),
}));

import { CommunicationService } from "@/features/communication/services/communication.service";
import {
  createEmailLog,
  hasBookingNotificationPendingOrSent,
} from "@/features/communication/services/email-log.repository";

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

describe("CommunicationService booking emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasBookingNotificationPendingOrSent).mockResolvedValue(false);
    vi.mocked(createEmailLog).mockImplementation(async (input) => ({
      id: `log-${input.template}`,
      recipient: input.recipient,
      template: input.template,
      subject: input.subject,
      status: "queued" as const,
      retries: 0,
      maxRetries: 3,
      errorMessage: null,
      bookingId: input.bookingId ?? null,
      metadata: input.metadata ?? null,
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  it("does not enqueue duplicate booking confirmation emails for the same booking", async () => {
    vi.mocked(hasBookingNotificationPendingOrSent).mockImplementation(async (_bookingId, template) => {
      return template === "booking_confirmed";
    });

    await CommunicationService.sendBookingConfirmed(baseBooking);

    expect(createEmailLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ template: "booking_confirmed" }),
    );
  });

  it("does not send booking confirmation emails for cancelled bookings", async () => {
    await CommunicationService.sendBookingConfirmed({
      ...baseBooking,
      status: "cancelled",
    });

    expect(createEmailLog).not.toHaveBeenCalled();
  });
});
