import { loadEmailBrandingContext } from "@/features/communication/lib/build-email-branding";
import {
  createEmailLog,
  getEmailLogById,
  hasSentTemplateRecently,
  updateEmailLogStatus,
} from "@/features/communication/services/email-log.repository";
import { queueEmailProcessing } from "@/features/communication/services/email-queue.service";
import {
  renderEmailTemplate,
  type PaymentEmailContext,
  type RenderEmailInput,
} from "@/features/communication/templates/render-email-template";
import { EMAIL_TEMPLATES, type EmailTemplateId } from "@/features/communication/types/email.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { formatCurrency } from "@/utils/format";

type EnqueueOptions = {
  recipient: string;
  template: EmailTemplateId;
  renderInput: Omit<RenderEmailInput, "branding">;
  bookingId?: string | null;
  skipIfDisabled?: "customer" | "owner";
};

async function enqueueRenderedEmail(options: EnqueueOptions): Promise<string | null> {
  const { branding, communication } = await loadEmailBrandingContext();

  if (options.skipIfDisabled === "customer" && !communication.enableCustomerEmails) {
    return null;
  }
  if (options.skipIfDisabled === "owner" && !communication.enableOwnerEmails) {
    return null;
  }

  if (!options.recipient?.trim()) return null;

  const rendered = renderEmailTemplate({
    ...options.renderInput,
    branding,
  });

  const log = await createEmailLog({
    recipient: options.recipient.trim(),
    template: options.template,
    subject: rendered.subject,
    bookingId: options.bookingId ?? null,
    metadata: {
      html: rendered.html,
      fromName: branding.fromName,
      replyTo: branding.replyTo,
    },
  });

  queueEmailProcessing(log.id);
  return log.id;
}

async function enqueueOwnerEmails(
  template: EmailTemplateId,
  renderInput: Omit<RenderEmailInput, "branding" | "template">,
  bookingId?: string | null,
): Promise<void> {
  const { communication } = await loadEmailBrandingContext();
  if (!communication.enableOwnerEmails) return;

  const recipients = communication.ownerNotificationEmails;
  if (recipients.length === 0) return;

  await Promise.all(
    recipients.map((recipient) =>
      enqueueRenderedEmail({
        recipient,
        template,
        renderInput: { template, ...renderInput },
        bookingId,
        skipIfDisabled: "owner",
      }),
    ),
  );
}

function bookingRenderInput(booking: BookingRecord) {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    selectedSlots: booking.selectedSlots,
    totalPrice: booking.totalPrice,
    advancePaid: booking.advancePaid,
    remainingAmount: booking.remainingAmount,
    status: booking.status,
    source: booking.source,
  };
}

export const CommunicationService = {
  async sendBookingConfirmed(booking: BookingRecord): Promise<void> {
    const customerEmail = booking.customerEmail?.trim();

    if (customerEmail) {
      await enqueueRenderedEmail({
        recipient: customerEmail,
        template: EMAIL_TEMPLATES.BOOKING_CONFIRMED,
        bookingId: booking.id,
        skipIfDisabled: "customer",
        renderInput: {
          template: EMAIL_TEMPLATES.BOOKING_CONFIRMED,
          booking: bookingRenderInput({ ...booking, customerEmail }),
        },
      });

      if (booking.advancePaid > 0) {
        await this.sendPaymentReceived(
          { ...booking, customerEmail },
          {
            amount: booking.advancePaid,
            method: booking.source === "manual" ? "Cash" : "Online",
            referenceNumber: booking.source === "manual" ? null : booking.paymentId,
            outstandingBalance: booking.remainingAmount,
          },
        );
      }
    }

    const ownerTemplate =
      booking.source === "manual"
        ? EMAIL_TEMPLATES.OWNER_MANUAL_BOOKING
        : EMAIL_TEMPLATES.OWNER_NEW_BOOKING;
    await enqueueOwnerEmails(
      ownerTemplate,
      {
        owner: {
          title: booking.source === "manual" ? "Manual Booking Created" : "New Booking",
          summary:
            booking.source === "manual"
              ? "An admin created a manual booking."
              : "A new online booking was confirmed.",
          details: [
            { label: "Booking ID", value: booking.bookingReference },
            { label: "Customer", value: booking.customerName },
            { label: "Date", value: booking.bookingDate },
            { label: "Time", value: `${booking.startTime} – ${booking.endTime}` },
            { label: "Slots", value: String(booking.selectedSlots.length) },
            { label: "Total", value: formatCurrency(booking.totalPrice) },
            { label: "Advance", value: formatCurrency(booking.advancePaid) },
          ],
        },
      },
      booking.id,
    );
  },

  async sendBookingCancelled(booking: BookingRecord, cancelledAt = new Date()): Promise<void> {
    if (booking.customerEmail) {
      await enqueueRenderedEmail({
        recipient: booking.customerEmail,
        template: EMAIL_TEMPLATES.BOOKING_CANCELLED,
        bookingId: booking.id,
        skipIfDisabled: "customer",
        renderInput: {
          template: EMAIL_TEMPLATES.BOOKING_CANCELLED,
          booking: bookingRenderInput(booking),
          cancellationTime: cancelledAt.toISOString(),
        },
      });
    }

    await enqueueOwnerEmails(
      EMAIL_TEMPLATES.OWNER_BOOKING_CANCELLED,
      {
        owner: {
          title: "Booking Cancelled",
          summary: "A booking was cancelled.",
          details: [
            { label: "Booking ID", value: booking.bookingReference },
            { label: "Customer", value: booking.customerName },
            { label: "Date", value: booking.bookingDate },
            { label: "Cancelled At", value: cancelledAt.toLocaleString("en-IN") },
          ],
        },
      },
      booking.id,
    );
  },

  async sendPaymentReceived(
    booking: BookingRecord,
    payment: Omit<PaymentEmailContext, "bookingReference" | "customerName">,
  ): Promise<void> {
    if (!booking.customerEmail) return;

    await enqueueRenderedEmail({
      recipient: booking.customerEmail,
      template: EMAIL_TEMPLATES.PAYMENT_RECEIVED,
      bookingId: booking.id,
      skipIfDisabled: "customer",
      renderInput: {
        template: EMAIL_TEMPLATES.PAYMENT_RECEIVED,
        payment: {
          bookingReference: booking.bookingReference,
          customerName: booking.customerName,
          ...payment,
        },
      },
    });
  },

  async sendPaymentCollectedOwner(
    booking: BookingRecord,
    payment: { amount: number; method: string; referenceNumber?: string | null },
  ): Promise<void> {
    await enqueueOwnerEmails(
      EMAIL_TEMPLATES.OWNER_PAYMENT_COLLECTED,
      {
        owner: {
          title: "Payment Collected",
          summary: "Remaining payment was collected.",
          details: [
            { label: "Booking ID", value: booking.bookingReference },
            { label: "Customer", value: booking.customerName },
            { label: "Amount", value: formatCurrency(payment.amount) },
            { label: "Method", value: payment.method },
            {
              label: "Reference",
              value: payment.referenceNumber ?? "—",
            },
          ],
        },
      },
      booking.id,
    );
  },

  async sendPaymentReminder(booking: BookingRecord): Promise<void> {
    if (!booking.customerEmail || booking.remainingAmount <= 0) return;

    await enqueueRenderedEmail({
      recipient: booking.customerEmail,
      template: EMAIL_TEMPLATES.PAYMENT_REMINDER,
      bookingId: booking.id,
      skipIfDisabled: "customer",
      renderInput: {
        template: EMAIL_TEMPLATES.PAYMENT_REMINDER,
        payment: {
          bookingReference: booking.bookingReference,
          customerName: booking.customerName,
          amount: booking.remainingAmount,
          method: "—",
          outstandingBalance: booking.remainingAmount,
        },
      },
    });
  },

  async sendWelcomeEmail(input: {
    email: string;
    customerName: string;
  }): Promise<void> {
    const alreadySent = await hasSentTemplateRecently(input.email, EMAIL_TEMPLATES.WELCOME, 24 * 365);
    if (alreadySent) return;

    await enqueueRenderedEmail({
      recipient: input.email,
      template: EMAIL_TEMPLATES.WELCOME,
      skipIfDisabled: "customer",
      renderInput: {
        template: EMAIL_TEMPLATES.WELCOME,
        welcome: { customerName: input.customerName },
      },
    });
  },

  async sendPaymentFailedOwner(input: {
    sessionId: string;
    customerEmail?: string | null;
    reason: string;
  }): Promise<void> {
    await enqueueOwnerEmails(EMAIL_TEMPLATES.OWNER_PAYMENT_FAILED, {
      owner: {
        title: "Payment Failed",
        summary: "An online payment verification failed.",
        details: [
          { label: "Session", value: input.sessionId },
          { label: "Customer", value: input.customerEmail ?? "—" },
          { label: "Reason", value: input.reason },
        ],
      },
    });
  },

  async sendCriticalError(input: {
    message: string;
    module?: string;
    details?: string;
  }): Promise<void> {
    await enqueueOwnerEmails(EMAIL_TEMPLATES.OWNER_CRITICAL_ERROR, {
      critical: input,
      owner: {
        title: "Critical System Error",
        summary: input.message,
      },
    });
  },

  async resendEmailLog(logId: string): Promise<boolean> {
    const log = await getEmailLogById(logId);
    if (!log) return false;

    await updateEmailLogStatus(logId, {
      status: "queued",
      retries: 0,
      errorMessage: null,
      sentAt: null,
    });
    queueEmailProcessing(logId);
    return true;
  },
};
