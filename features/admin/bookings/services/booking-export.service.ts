import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { formatBookingDateLabel, formatDurationLabel } from "@/features/admin/bookings/lib/booking-utils";
import { formatCurrency } from "@/utils";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildBookingsCsv(bookings: AdminBookingRecord[]): string {
  const headers = [
    "Booking ID",
    "Customer",
    "Phone",
    "Email",
    "Date",
    "Time",
    "Duration",
    "Total",
    "Advance",
    "Remaining",
    "Payment Status",
    "Booking Status",
    "Source",
    "Created At",
  ];

  const rows = bookings.map((booking) =>
    [
      booking.bookingReference,
      booking.customerName,
      booking.customerPhone,
      booking.customerEmail,
      formatBookingDateLabel(booking.bookingDate),
      `${booking.startTime} – ${booking.endTime}`,
      formatDurationLabel(booking.durationMinutes),
      formatCurrency(booking.totalPrice),
      formatCurrency(booking.advancePaid),
      formatCurrency(booking.remainingAmount),
      booking.paymentStatus,
      booking.status,
      booking.source,
      booking.createdAt instanceof Date
        ? booking.createdAt.toISOString()
        : new Date(booking.createdAt).toISOString(),
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function buildBookingsExcelCsv(bookings: AdminBookingRecord[]): string {
  return `\uFEFF${buildBookingsCsv(bookings)}`;
}

export function buildBookingsPdfHtml(bookings: AdminBookingRecord[], venueName: string): string {
  const rows = bookings
    .map(
      (booking) => `
      <tr>
        <td>${booking.bookingReference}</td>
        <td>${booking.customerName}</td>
        <td>${booking.customerPhone}</td>
        <td>${formatBookingDateLabel(booking.bookingDate)}</td>
        <td>${booking.startTime}</td>
        <td>${formatCurrency(booking.totalPrice)}</td>
        <td>${booking.paymentStatus}</td>
        <td>${booking.status}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${venueName} — Bookings Export</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    p { color: #666; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #666; }
  </style>
</head>
<body>
  <h1>${venueName}</h1>
  <p>Bookings export · ${bookings.length} records · ${new Date().toLocaleString("en-IN")}</p>
  <table>
    <thead>
      <tr>
        <th>Booking ID</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>Date</th>
        <th>Time</th>
        <th>Total</th>
        <th>Payment</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
