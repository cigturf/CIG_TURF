import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import { formatCurrency } from "@/utils";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildFinanceCsv(data: FinanceDashboardData): string {
  const overviewRows = [
    ["Metric", "Value"],
    ["Period", data.range.label],
    ["From", data.range.from],
    ["To", data.range.to],
    ["Today's Revenue", data.overview.todaysRevenue],
    ["This Week Revenue", data.overview.thisWeekRevenue],
    ["This Month Revenue", data.overview.thisMonthRevenue],
    ["Pending Collections", data.overview.pendingCollections],
    ["Advance Collected", data.overview.advanceCollected],
    ["Offline Collections", data.overview.offlineCollections],
    ["Online Collections", data.overview.onlineCollections],
    ["Average Booking Value", data.overview.averageBookingValue],
    ["Expected Revenue", data.reconciliation.expectedRevenue],
    ["Collected Revenue", data.reconciliation.collectedRevenue],
    ["Outstanding Revenue", data.reconciliation.outstandingRevenue],
    ["Discrepancy", data.reconciliation.discrepancy],
  ];

  const sections = [
    overviewRows.map((row) => row.map(escapeCsv).join(",")).join("\n"),
    "",
    "Transactions",
    "Date,Booking,Customer,Amount,Method,Type,Collected By,Reference,Status",
    ...data.transactions.map((txn) =>
      [
        txn.createdAt,
        txn.bookingReference,
        txn.customerName,
        txn.amount,
        txn.method,
        txn.type,
        txn.collectedBy ?? "",
        txn.referenceNumber ?? "",
        txn.status,
      ]
        .map(escapeCsv)
        .join(","),
    ),
    "",
    "Pending Collections",
    "Booking ID,Customer,Phone,Outstanding,Booking Date,Time",
    ...data.pendingBookings.map((booking) =>
      [
        booking.bookingReference,
        booking.customerName,
        booking.customerPhone,
        booking.outstanding,
        booking.bookingDate,
        booking.startTime,
      ]
        .map(escapeCsv)
        .join(","),
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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${venueName} — Finance Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 22px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
    .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #666; }
    .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #666; }
  </style>
</head>
<body>
  <h1>${venueName} — Finance</h1>
  <p>${data.range.label} · ${data.range.from} to ${data.range.to}</p>
  <div class="grid">
    <div class="card"><div class="label">Today's Revenue</div><div class="value">${formatCurrency(data.overview.todaysRevenue)}</div></div>
    <div class="card"><div class="label">This Week</div><div class="value">${formatCurrency(data.overview.thisWeekRevenue)}</div></div>
    <div class="card"><div class="label">This Month</div><div class="value">${formatCurrency(data.overview.thisMonthRevenue)}</div></div>
    <div class="card"><div class="label">Pending</div><div class="value">${formatCurrency(data.overview.pendingCollections)}</div></div>
    <div class="card"><div class="label">Collected (period)</div><div class="value">${formatCurrency(data.reconciliation.collectedRevenue)}</div></div>
    <div class="card"><div class="label">Outstanding</div><div class="value">${formatCurrency(data.reconciliation.outstandingRevenue)}</div></div>
  </div>
  <h2>Recent Transactions</h2>
  <table>
    <thead><tr><th>Date</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Method</th><th>Type</th></tr></thead>
    <tbody>${txnRows}</tbody>
  </table>
</body>
</html>`;
}
