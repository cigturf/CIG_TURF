import type { ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";
import { formatCurrency } from "@/utils";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function section(title: string, headerRow: string[], rows: (string | number)[][]): string {
  return [
    title,
    headerRow.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
}

function seriesToCsv(title: string, series: { label: string; value: number }[]) {
  return section(title, ["Label", "Value"], series.map((point) => [point.label, point.value]));
}

export function buildReportsCsv(data: ReportsAnalyticsData): string {
  const sections = [
    section("REPORTS & ANALYTICS", ["Field", "Value"], [
      ["Period", data.range.label],
      ["From", data.range.from],
      ["To", data.range.to],
      ["Generated At", new Date(data.generatedAt).toLocaleString("en-IN")],
    ]),
    "",
    section("BOOKINGS IN PERIOD", ["Metric", "Count"], [
      ["Total Bookings", data.overview.totalBookings],
      ["Active Bookings", data.overview.activeBookings],
      ["Completed Bookings", data.overview.completedBookings],
      ["Cancelled Bookings", data.overview.cancelledBookings],
      ["Online Bookings", data.overview.onlineBookings],
      ["Manual Bookings (Front Desk)", data.overview.manualBookings],
    ]),
    "",
    section("REVENUE SUMMARY", ["Metric", "Amount"], [
      ["Total Amount (booking value)", data.overview.totalAmount],
      ["Total Revenue (collected)", data.overview.totalRevenue],
      ["Advance Collected", data.overview.advanceCollected],
      ["Offline Collections (Cash / UPI / Card)", data.overview.offlineCollections],
      ["Online Collections (Razorpay)", data.overview.onlineCollections],
      ["Pending Collections", data.overview.pendingCollections],
      ["Average Booking Value", data.overview.averageBookingValue],
    ]),
    "",
    section("OCCUPANCY", ["Metric", "Value"], [
      ["Available Slots", data.occupancy.availableSlots],
      ["Booked Slots", data.occupancy.bookedSlots],
      ["Blocked Slots", data.occupancy.blockedSlots],
      ["Maintenance Slots", data.occupancy.maintenanceSlots],
      ["Occupancy Rate", `${data.overview.occupancyRate}%`],
    ]),
    "",
    seriesToCsv("Bookings Per Day", data.bookingsPerDay),
    "",
    seriesToCsv("Daily Revenue", data.dailyRevenue),
    "",
    seriesToCsv("Cancellation Trend", data.cancellationTrend),
    "",
    section(
      "PAYMENT METHOD BREAKDOWN",
      ["Method", "Amount", "Transaction Count", "Share"],
      data.paymentBreakdown.map((item) => [
        item.method,
        item.amount,
        item.count,
        `${item.percentage}%`,
      ]),
    ),
  ];

  return sections.join("\n");
}

export function buildReportsExcelCsv(data: ReportsAnalyticsData): string {
  return `\uFEFF${buildReportsCsv(data)}`;
}

export function buildReportsPdfHtml(data: ReportsAnalyticsData, venueName: string): string {
  const overview = data.overview;
  const paymentRows = data.paymentBreakdown
    .map(
      (item) => `
      <tr>
        <td>${item.method}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.count}</td>
        <td>${item.percentage}%</td>
      </tr>`,
    )
    .join("");

  const bookingRows = data.bookingsPerDay
    .map(
      (point) => `
      <tr>
        <td>${point.label}</td>
        <td>${point.value}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${venueName} — Analytics Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin-top: 28px; }
    p { color: #666; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
    .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #666; }
    .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #666; }
  </style>
</head>
<body>
  <h1>${venueName}</h1>
  <p>Analytics report · ${data.range.label} · ${data.range.from} to ${data.range.to}</p>
  <div class="grid">
    <div class="card"><div class="label">Total Bookings</div><div class="value">${overview.totalBookings}</div></div>
    <div class="card"><div class="label">Completed</div><div class="value">${overview.completedBookings}</div></div>
    <div class="card"><div class="label">Cancelled</div><div class="value">${overview.cancelledBookings}</div></div>
    <div class="card"><div class="label">Occupancy</div><div class="value">${overview.occupancyRate}%</div></div>
    <div class="card"><div class="label">Total Amount</div><div class="value">${formatCurrency(overview.totalAmount)}</div></div>
    <div class="card"><div class="label">Total Revenue</div><div class="value">${formatCurrency(overview.totalRevenue)}</div></div>
    <div class="card"><div class="label">Advance Collected</div><div class="value">${formatCurrency(overview.advanceCollected)}</div></div>
    <div class="card"><div class="label">Offline Collections</div><div class="value">${formatCurrency(overview.offlineCollections)}</div></div>
    <div class="card"><div class="label">Online Collections</div><div class="value">${formatCurrency(overview.onlineCollections)}</div></div>
    <div class="card"><div class="label">Pending Collections</div><div class="value">${formatCurrency(overview.pendingCollections)}</div></div>
    <div class="card"><div class="label">Avg Booking Value</div><div class="value">${formatCurrency(overview.averageBookingValue)}</div></div>
    <div class="card"><div class="label">Online / Manual</div><div class="value">${overview.onlineBookings} / ${overview.manualBookings}</div></div>
  </div>
  <h2>Bookings Per Day</h2>
  <table>
    <thead><tr><th>Date</th><th>Bookings</th></tr></thead>
    <tbody>${bookingRows}</tbody>
  </table>
  <h2>Payment Breakdown</h2>
  <table>
    <thead><tr><th>Method</th><th>Amount</th><th>Count</th><th>Share</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>
</body>
</html>`;
}

export type ReportExportKind = "daily" | "weekly" | "monthly" | "custom";

export function resolveExportFilename(
  kind: ReportExportKind,
  rangeLabel: string,
  extension: string,
): string {
  const slug = rangeLabel.toLowerCase().replace(/\s+/g, "-");
  return `report-${kind}-${slug}.${extension}`;
}
