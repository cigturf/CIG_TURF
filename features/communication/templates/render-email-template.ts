import { escapeHtml } from "@/features/communication/lib/escape-html";
import {
  renderDetailTable,
  renderEmailLayout,
} from "@/features/communication/templates/email-layout";
import type { EmailBrandingContext } from "@/features/communication/types/email.types";
import { EMAIL_TEMPLATES, type EmailTemplateId } from "@/features/communication/types/email.types";
import { formatCurrency } from "@/utils/format";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

export type BookingEmailContext = {
  booking: Pick<
    BookingRecord,
    | "id"
    | "bookingReference"
    | "customerName"
    | "customerEmail"
    | "bookingDate"
    | "startTime"
    | "endTime"
    | "selectedSlots"
    | "totalPrice"
    | "advancePaid"
    | "remainingAmount"
    | "status"
    | "source"
  >;
  paymentStatus?: string;
  cancellationTime?: string;
  refundInfo?: string | null;
};

export type PaymentEmailContext = {
  bookingReference: string;
  customerName: string;
  amount: number;
  method: string;
  referenceNumber?: string | null;
  outstandingBalance: number;
  paymentLabel?: string;
};

export type WelcomeEmailContext = {
  customerName: string;
};

export type OwnerAlertContext = {
  title: string;
  summary: string;
  bookingReference?: string;
  customerName?: string;
  amount?: number;
  details?: Array<{ label: string; value: string }>;
};

export type CriticalErrorContext = {
  message: string;
  module?: string;
  details?: string;
};

export type RenderEmailInput = {
  template: EmailTemplateId;
  branding: EmailBrandingContext;
  booking?: BookingEmailContext["booking"];
  payment?: PaymentEmailContext;
  welcome?: WelcomeEmailContext;
  owner?: OwnerAlertContext;
  critical?: CriticalErrorContext;
  cancellationTime?: string;
  paymentStatus?: string;
};

function resolvePaymentStatus(booking: BookingEmailContext["booking"]): string {
  if (booking.remainingAmount <= 0) return "Paid in full";
  if (booking.advancePaid > 0) return "Partially paid";
  return "Payment pending";
}

function formatBookingTime(start: string, end: string): string {
  return `${start} – ${end}`;
}

function mapsLink(branding: EmailBrandingContext): string | null {
  return branding.googleMapsLink;
}

function buildBookingRows(
  booking: BookingEmailContext["booking"],
  branding: EmailBrandingContext,
  paymentStatus?: string,
): Array<{ label: string; value: string }> {
  const maps = mapsLink(branding);
  return [
    { label: "Booking ID", value: escapeHtml(booking.bookingReference) },
    { label: "Customer", value: escapeHtml(booking.customerName) },
    { label: "Date", value: escapeHtml(booking.bookingDate) },
    {
      label: "Time",
      value: escapeHtml(formatBookingTime(booking.startTime, booking.endTime)),
    },
    { label: "Slots", value: String(booking.selectedSlots.length) },
    { label: "Total Amount", value: escapeHtml(formatCurrency(booking.totalPrice)) },
    { label: "Advance Paid", value: escapeHtml(formatCurrency(booking.advancePaid)) },
    {
      label: "Remaining",
      value: escapeHtml(formatCurrency(booking.remainingAmount)),
    },
    { label: "Payment Status", value: escapeHtml(paymentStatus ?? resolvePaymentStatus(booking)) },
    {
      label: "Ground Address",
      value: branding.address ? escapeHtml(branding.address) : "—",
    },
    {
      label: "Directions",
      value: maps
        ? `<a href="${escapeHtml(maps)}" style="color:${branding.accentColor};">Open in Google Maps</a>`
        : "—",
    },
    {
      label: "Support",
      value: branding.supportEmail
        ? `<a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:${branding.accentColor};">${escapeHtml(branding.supportEmail)}</a>`
        : branding.phone
          ? escapeHtml(branding.phone)
          : "—",
    },
  ];
}

export function renderEmailTemplate(input: RenderEmailInput): { subject: string; html: string } {
  const { template, branding } = input;

  switch (template) {
    case EMAIL_TEMPLATES.BOOKING_CONFIRMED: {
      const booking = input.booking!;
      const subject = `Booking confirmed — ${booking.bookingReference}`;
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hi ${escapeHtml(booking.customerName)}, your turf booking is confirmed. We look forward to seeing you on the ground.</p>
        ${renderDetailTable(buildBookingRows(booking, branding, input.paymentStatus))}
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: "Booking Confirmed",
          previewText: `Your booking ${booking.bookingReference} is confirmed.`,
          bodyHtml: body,
          cta: {
            label: "Manage Booking",
            href: `${branding.appUrl}/booking/confirmation/${booking.id}`,
          },
        }),
      };
    }

    case EMAIL_TEMPLATES.BOOKING_CANCELLED: {
      const booking = input.booking!;
      const cancelledAt = input.cancellationTime ?? new Date().toISOString();
      const subject = `Booking cancelled — ${booking.bookingReference}`;
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hi ${escapeHtml(booking.customerName)}, your booking has been cancelled as requested.</p>
        ${renderDetailTable([
          ...buildBookingRows(booking, branding).slice(0, 6),
          { label: "Cancelled At", value: escapeHtml(new Date(cancelledAt).toLocaleString("en-IN")) },
          {
            label: "Refund",
            value: "Refund processing will be communicated separately.",
          },
        ])}
        <p style="margin:16px 0 0;font-size:14px;color:#64748b;">Need help? Contact us at ${branding.supportEmail ? escapeHtml(branding.supportEmail) : branding.phone ?? "support"}.</p>
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: "Booking Cancelled",
          previewText: `Booking ${booking.bookingReference} was cancelled.`,
          bodyHtml: body,
        }),
      };
    }

    case EMAIL_TEMPLATES.BOOKING_RESCHEDULED: {
      const booking = input.booking!;
      const subject = `Booking rescheduled — ${booking.bookingReference}`;
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Your booking has been rescheduled. Updated details are below.</p>
        ${renderDetailTable(buildBookingRows(booking, branding))}
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: "Booking Rescheduled",
          previewText: `Booking ${booking.bookingReference} was rescheduled.`,
          bodyHtml: body,
        }),
      };
    }

    case EMAIL_TEMPLATES.PAYMENT_RECEIVED:
    case EMAIL_TEMPLATES.PAYMENT_REMINDER: {
      const payment = input.payment!;
      const isReminder = template === EMAIL_TEMPLATES.PAYMENT_REMINDER;
      const subject = isReminder
        ? `Payment reminder — ${payment.bookingReference}`
        : `Payment received — ${payment.bookingReference}`;
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hi ${escapeHtml(payment.customerName)}, ${isReminder ? "this is a friendly reminder about your outstanding balance." : "thank you — we have received your payment."}</p>
        ${renderDetailTable([
          { label: "Booking ID", value: escapeHtml(payment.bookingReference) },
          { label: "Amount", value: escapeHtml(formatCurrency(payment.amount)) },
          { label: "Method", value: escapeHtml(payment.method) },
          {
            label: "Reference",
            value: payment.referenceNumber ? escapeHtml(payment.referenceNumber) : "—",
          },
          {
            label: "Outstanding Balance",
            value: escapeHtml(formatCurrency(payment.outstandingBalance)),
          },
        ])}
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: isReminder ? "Payment Reminder" : "Payment Received",
          previewText: subject,
          bodyHtml: body,
        }),
      };
    }

    case EMAIL_TEMPLATES.WELCOME: {
      const welcome = input.welcome!;
      const subject = `Welcome to ${branding.businessName}`;
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hi ${escapeHtml(welcome.customerName)}, welcome aboard! Your account is ready — book your next match in just a few taps.</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">Premium turf, flexible slots, and seamless payments — all in one place.</p>
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: "Welcome",
          previewText: `Welcome to ${branding.businessName}`,
          bodyHtml: body,
          cta: branding.websiteUrl
            ? { label: "Book Now", href: branding.websiteUrl }
            : null,
        }),
      };
    }

    case EMAIL_TEMPLATES.OWNER_NEW_BOOKING:
    case EMAIL_TEMPLATES.OWNER_MANUAL_BOOKING:
    case EMAIL_TEMPLATES.OWNER_BOOKING_CANCELLED:
    case EMAIL_TEMPLATES.OWNER_PAYMENT_COLLECTED:
    case EMAIL_TEMPLATES.OWNER_PAYMENT_FAILED: {
      const owner = input.owner!;
      const subject = owner.title;
      const rows = owner.details ?? [];
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(owner.summary)}</p>
        ${rows.length > 0 ? renderDetailTable(rows) : ""}
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: owner.title,
          previewText: owner.summary,
          bodyHtml: body,
        }),
      };
    }

    case EMAIL_TEMPLATES.OWNER_CRITICAL_ERROR: {
      const critical = input.critical!;
      const subject = `Critical alert — ${branding.businessName}`;
      const body = `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#b91c1c;font-weight:600;">${escapeHtml(critical.message)}</p>
        ${critical.module ? `<p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Module:</strong> ${escapeHtml(critical.module)}</p>` : ""}
        ${critical.details ? `<pre style="background:#f8fafc;padding:12px;border-radius:8px;font-size:12px;overflow:auto;">${escapeHtml(critical.details)}</pre>` : ""}
      `;
      return {
        subject,
        html: renderEmailLayout({
          branding,
          title: "Critical System Error",
          previewText: critical.message,
          bodyHtml: body,
        }),
      };
    }

    default:
      return {
        subject: "Notification",
        html: renderEmailLayout({
          branding,
          title: "Notification",
          bodyHtml: "<p>Notification</p>",
        }),
      };
  }
}

export function buildPreviewRenderInput(
  template: EmailTemplateId,
  branding: EmailBrandingContext,
): RenderEmailInput {
  const sampleBooking = {
    id: "preview-booking",
    bookingReference: "CIG-20260707-001",
    customerName: "Rahul Sharma",
    customerEmail: "rahul@example.com",
    bookingDate: "2026-07-12",
    startTime: "18:00",
    endTime: "20:00",
    selectedSlots: ["slot-1", "slot-2"],
    totalPrice: 1800,
    advancePaid: 500,
    remainingAmount: 1300,
    status: "confirmed" as const,
    source: "online" as const,
  };

  const samplePayment: PaymentEmailContext = {
    bookingReference: sampleBooking.bookingReference,
    customerName: sampleBooking.customerName,
    amount: 500,
    method: "UPI",
    referenceNumber: "RZP-PREVIEW-001",
    outstandingBalance: 1300,
  };

  switch (template) {
    case EMAIL_TEMPLATES.BOOKING_CONFIRMED:
    case EMAIL_TEMPLATES.BOOKING_CANCELLED:
    case EMAIL_TEMPLATES.BOOKING_RESCHEDULED:
      return {
        template,
        branding,
        booking: sampleBooking,
        cancellationTime: new Date().toISOString(),
      };
    case EMAIL_TEMPLATES.PAYMENT_RECEIVED:
    case EMAIL_TEMPLATES.PAYMENT_REMINDER:
      return { template, branding, payment: samplePayment };
    case EMAIL_TEMPLATES.WELCOME:
      return { template, branding, welcome: { customerName: "Rahul Sharma" } };
    case EMAIL_TEMPLATES.OWNER_NEW_BOOKING:
      return {
        template,
        branding,
        owner: {
          title: "New Booking",
          summary: "A new online booking was confirmed.",
          details: buildBookingRows(sampleBooking, branding).slice(0, 7),
        },
      };
    case EMAIL_TEMPLATES.OWNER_MANUAL_BOOKING:
      return {
        template,
        branding,
        owner: {
          title: "Manual Booking Created",
          summary: "An admin created a manual booking.",
          details: buildBookingRows({ ...sampleBooking, source: "manual" }, branding).slice(0, 7),
        },
      };
    case EMAIL_TEMPLATES.OWNER_BOOKING_CANCELLED:
      return {
        template,
        branding,
        owner: {
          title: "Booking Cancelled",
          summary: "A booking was cancelled.",
          details: buildBookingRows(sampleBooking, branding).slice(0, 5),
        },
      };
    case EMAIL_TEMPLATES.OWNER_PAYMENT_COLLECTED:
      return {
        template,
        branding,
        owner: {
          title: "Payment Collected",
          summary: "Remaining payment was collected at the ground.",
          details: [
            { label: "Booking ID", value: sampleBooking.bookingReference },
            { label: "Amount", value: formatCurrency(1300) },
            { label: "Method", value: "Cash" },
          ],
        },
      };
    case EMAIL_TEMPLATES.OWNER_PAYMENT_FAILED:
      return {
        template,
        branding,
        owner: {
          title: "Payment Failed",
          summary: "An online payment verification failed.",
          details: [
            { label: "Session", value: "session-preview" },
            { label: "Reason", value: "Signature mismatch" },
          ],
        },
      };
    case EMAIL_TEMPLATES.OWNER_CRITICAL_ERROR:
      return {
        template,
        branding,
        critical: {
          message: "Database connection pool exhausted",
          module: "booking.finalize",
          details: "Sample stack trace for preview only.",
        },
      };
    default:
      return { template, branding, booking: sampleBooking };
  }
}
