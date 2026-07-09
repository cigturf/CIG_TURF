import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { escapeHtml } from "@/features/communication/lib/escape-html";
import { formatCurrency } from "@/utils";
import { formatDate } from "@/utils/format";

type BuildReceiptOptions = {
  booking: BookingRecord;
  venueName: string;
  payments?: BookingPaymentRecord[];
};

function formatPaymentMethod(method: string): string {
  return method.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPaymentType(type: BookingPaymentRecord["type"]): string {
  if (type === "advance") return "Advance";
  if (type === "remaining") return "Collected";
  return type[0]!.toUpperCase() + type.slice(1);
}

export function buildBookingReceiptHtml({
  booking,
  venueName,
  payments = [],
}: BuildReceiptOptions): string {
  const timeRange = `${booking.startTime} – ${booking.endTime}`;
  const issuedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const offlineCollections = payments.filter((payment) => payment.type === "remaining");
  const advanceRecord = payments.find((payment) => payment.type === "advance");
  const advanceAmount = advanceRecord?.amount ?? booking.advancePaid - offlineCollections.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = booking.advancePaid;
  const outstanding = booking.remainingAmount;

  const paymentRows =
    payments.length > 0
      ? payments
          .map(
            (payment) => `
      <tr>
        <td>${formatPaymentType(payment.type)}</td>
        <td>${formatCurrency(payment.amount)}</td>
        <td>${formatPaymentMethod(payment.method)}</td>
        <td>${payment.createdAt.toLocaleString("en-IN", { timeStyle: "short", dateStyle: "medium" })}</td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="4" class="muted">No transaction history recorded.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Booking Receipt — ${escapeHtml(booking.bookingReference)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; margin: 0; padding: 32px; }
    .wrap { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; letter-spacing: 0.04em; }
    h2 { font-size: 1rem; margin: 28px 0 12px; }
    .ref { color: #16a34a; font-weight: 700; font-size: 1.125rem; }
    .muted { color: #6b7280; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td, th { padding: 10px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; text-align: left; }
    td:first-child, th:first-child { color: #6b7280; width: 28%; }
    .summary td { font-weight: 700; border-bottom: none; padding-top: 12px; }
    .payments th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
    .qr { margin-top: 28px; padding: 20px; border: 1px dashed #d1d5db; border-radius: 12px; text-align: center; color: #9ca3af; font-size: 0.875rem; }
    @media print { body { padding: 0; } .wrap { border: none; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(venueName)}</h1>
    <p class="muted">Booking receipt · Issued ${escapeHtml(issuedAt)}</p>
    <p class="ref">${escapeHtml(booking.bookingReference)}</p>
    <table>
      <tr><td>Venue</td><td>${escapeHtml(venueName)}</td></tr>
      <tr><td>Date</td><td>${escapeHtml(formatDate(booking.bookingDate))}</td></tr>
      <tr><td>Time</td><td>${escapeHtml(timeRange)}</td></tr>
      <tr><td>Duration</td><td>${booking.durationMinutes} minutes</td></tr>
      <tr><td>Customer</td><td>${escapeHtml(booking.customerName)}</td></tr>
      <tr><td>Phone</td><td>${escapeHtml(booking.customerPhone)}</td></tr>
      <tr><td>Email</td><td>${escapeHtml(booking.customerEmail)}</td></tr>
      <tr><td>Status</td><td>${escapeHtml(booking.status.replace(/_/g, " "))}</td></tr>
    </table>

    <h2>Payment Summary</h2>
    <table>
      <tr class="summary"><td>Total Booking Amount</td><td>${formatCurrency(booking.totalPrice)}</td></tr>
      <tr class="summary"><td>Advance Paid</td><td>${formatCurrency(Math.max(advanceAmount, 0))}</td></tr>
      <tr class="summary"><td>Offline Collections</td><td>${formatCurrency(offlineCollections.reduce((sum, payment) => sum + payment.amount, 0))}</td></tr>
      <tr class="summary"><td>Total Paid</td><td>${formatCurrency(totalPaid)}</td></tr>
      <tr class="summary"><td>Outstanding</td><td>${formatCurrency(outstanding)}</td></tr>
    </table>

    <h2>Payment History</h2>
    <table class="payments">
      <thead>
        <tr>
          <th>Type</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>

    <div class="qr">QR code placeholder — scan at venue</div>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`;
}
