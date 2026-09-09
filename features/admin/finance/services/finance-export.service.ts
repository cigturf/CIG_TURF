import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
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

export function buildFinanceCsv(data: FinanceDashboardData): string {
  const sections = [
    section("FINANCE REPORT", ["Field", "Value"], [
      ["Period", data.range.label],
      ["From", data.range.from],
      ["To", data.range.to],
      ["Generated At", new Date(data.generatedAt).toLocaleString("en-IN")],
    ]),
    "",
    section("SUMMARY", ["Metric", "Amount"], [
      ["Total Amount (booking value)", data.overview.totalAmount],
      ["Collected Amount", data.overview.collectedAmount],
      ["Pending Collections", data.overview.pendingCollections],
      ["Advance Collected", data.overview.advanceCollected],
      ["Offline Collections (Cash / UPI / Card)", data.overview.offlineCollections],
      ["Online Collections (Razorpay)", data.overview.onlineCollections],
      ["Average Booking Value", data.overview.averageBookingValue],
    ]),
    "",
    section("RECONCILIATION", ["Metric", "Amount"], [
      ["Expected Revenue", data.reconciliation.expectedRevenue],
      ["Collected Revenue", data.reconciliation.collectedRevenue],
      ["Outstanding Revenue", data.reconciliation.outstandingRevenue],
      ["Discrepancy", data.reconciliation.discrepancy],
      ["Has Discrepancy", data.reconciliation.hasDiscrepancy ? "Yes" : "No"],
    ]),
    "",
    section("BOOKINGS IN PERIOD", ["Metric", "Count / Value"], [
      ["Total Bookings", data.bookingCounts.totalBookings],
      ["Active Bookings", data.bookingCounts.activeBookings],
      ["Completed Bookings", data.bookingCounts.completedBookings],
      ["Cancelled Bookings", data.bookingCounts.cancelledBookings],
      ["Online Bookings", data.bookingCounts.onlineBookings],
      ["Online Bookings Value", data.bookingCounts.onlineBookingsValue],
      ["Manual Bookings (Front Desk)", data.bookingCounts.manualBookings],
      ["Manual Bookings Value", data.bookingCounts.manualBookingsValue],
    ]),
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
    "",
    section(
      "TRANSACTIONS",
      ["Date", "Booking", "Customer", "Amount", "Method", "Type", "Collected By", "Reference", "Status"],
      data.transactions.map((txn) => [
        new Date(txn.createdAt).toLocaleString("en-IN"),
        txn.bookingReference,
        txn.customerName,
        txn.amount,
        txn.method,
        txn.type,
        txn.collectedBy ?? "",
        txn.referenceNumber ?? "",
        txn.status,
      ]),
    ),
    "",
    section(
      "PENDING COLLECTIONS",
      ["Booking Reference", "Customer", "Phone", "Outstanding", "Booking Date", "Time"],
      data.pendingBookings.map((booking) => [
        booking.bookingReference,
        booking.customerName,
        booking.customerPhone,
        booking.outstanding,
        booking.bookingDate,
        booking.startTime,
      ]),
    ),
  ];

  return sections.join("\n");
}

export function buildFinanceExcelCsv(data: FinanceDashboardData): string {
  return `\uFEFF${buildFinanceCsv(data)}`;
}

export function buildFinancePdfHtml(data: FinanceDashboardData, venueName: string): string {
  const txnRows = data.transactions
    .slice(0, 50)
    .map(
      (txn) => `
      <tr>
        <td>${new Date(txn.createdAt).toLocaleString("en-IN")}</td>
        <td>${txn.bookingReference}</td>
        <td>${txn.customerName}</td>
        <td>${formatCurrency(txn.amount)}</td>
        <td>${txn.method}</td>
        <td>${txn.type}</td>
      </tr>`,
    )
    .join("");

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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${venueName} — Finance Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin-top: 28px; }
    p { color: #666; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #666; }
    .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #666; }
  </style>
</head>
<body>
  <h1>${venueName} — Finance</h1>
  <p>${data.range.label} · ${data.range.from} to ${data.range.to}</p>
  <div class="grid">
    <div class="card"><div class="label">Total Amount</div><div class="value">${formatCurrency(data.overview.totalAmount)}</div></div>
    <div class="card"><div class="label">Collected</div><div class="value">${formatCurrency(data.overview.collectedAmount)}</div></div>
    <div class="card"><div class="label">Pending</div><div class="value">${formatCurrency(data.overview.pendingCollections)}</div></div>
    <div class="card"><div class="label">Avg Booking Value</div><div class="value">${formatCurrency(data.overview.averageBookingValue)}</div></div>
    <div class="card"><div class="label">Offline Collections</div><div class="value">${formatCurrency(data.overview.offlineCollections)}</div></div>
    <div class="card"><div class="label">Online Collections</div><div class="value">${formatCurrency(data.overview.onlineCollections)}</div></div>
    <div class="card"><div class="label">Expected Revenue</div><div class="value">${formatCurrency(data.reconciliation.expectedRevenue)}</div></div>
    <div class="card"><div class="label">Discrepancy</div><div class="value">${formatCurrency(data.reconciliation.discrepancy)}</div></div>
  </div>
  <h2>Bookings</h2>
  <table>
    <thead><tr><th>Total</th><th>Completed</th><th>Cancelled</th><th>Online</th><th>Manual</th></tr></thead>
    <tbody>
      <tr>
        <td>${data.bookingCounts.totalBookings}</td>
        <td>${data.bookingCounts.completedBookings}</td>
        <td>${data.bookingCounts.cancelledBookings}</td>
        <td>${data.bookingCounts.onlineBookings} (${formatCurrency(data.bookingCounts.onlineBookingsValue)})</td>
        <td>${data.bookingCounts.manualBookings} (${formatCurrency(data.bookingCounts.manualBookingsValue)})</td>
      </tr>
    </tbody>
  </table>
  <h2>Payment Method Breakdown</h2>
  <table>
    <thead><tr><th>Method</th><th>Amount</th><th>Count</th><th>Share</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>
  <h2>Recent Transactions</h2>
  <table>
    <thead><tr><th>Date</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Method</th><th>Type</th></tr></thead>
    <tbody>${txnRows}</tbody>
  </table>
</body>
</html>`;
}
