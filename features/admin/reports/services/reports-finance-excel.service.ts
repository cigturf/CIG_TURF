import ExcelJS from "exceljs";

import { isGenuineRazorpayPayment } from "@/features/admin/bookings/lib/booking-utils";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import type { ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";

/** "Razorpay" only for a genuinely automatic online capture, never an
 * admin-recorded "online"/UPI collection at the counter. */
function formatTxnMethod(txn: Pick<BookingPaymentRecord, "method" | "collectedBy">): string {
  if (txn.method === "online") {
    return isGenuineRazorpayPayment(txn) ? "Razorpay" : "Online";
  }
  return txn.method;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F3D2B" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" } };
const TITLE_FONT: Partial<ExcelJS.Font> = { bold: true, size: 14 };
const SUBTITLE_FONT: Partial<ExcelJS.Font> = { italic: true, color: { argb: "FF6B7280" } };
const CURRENCY_FORMAT = '"₹"#,##0';

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle" };
  });
  row.height = 20;
}

function addTitleBlock(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  colSpan: number,
) {
  sheet.mergeCells(1, 1, 1, colSpan);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = TITLE_FONT;

  sheet.mergeCells(2, 1, 2, colSpan);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = SUBTITLE_FONT;

  sheet.addRow([]);
}

function autoFitColumns(sheet: ExcelJS.Worksheet, minWidths: number[]) {
  sheet.columns.forEach((column, index) => {
    const min = minWidths[index] ?? 12;
    let maxLength = min;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const length = String(cell.value ?? "").length;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 48);
  });
}

export async function buildReportsFinanceWorkbook(
  reports: ReportsAnalyticsData,
  finance: FinanceDashboardData,
  venueName: string,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = venueName;
  workbook.created = new Date();

  const periodLabel = `${finance.range.label} · ${finance.range.from} to ${finance.range.to}`;

  // ── Summary ──────────────────────────────────────────────────────────
  const summary = workbook.addWorksheet("Summary");
  addTitleBlock(summary, `${venueName} — Reports & Finances`, periodLabel, 2);

  const addSummarySection = (title: string, rows: [string, string | number][]) => {
    const headerRow = summary.addRow([title, ""]);
    styleHeaderRow(headerRow);
    for (const [label, value] of rows) {
      summary.addRow([label, value]);
    }
    summary.addRow([]);
  };

  addSummarySection("BOOKINGS IN PERIOD", [
    ["Total Bookings", reports.overview.totalBookings],
    ["Active Bookings", reports.overview.activeBookings],
    ["Completed Bookings", reports.overview.completedBookings],
    ["Cancelled Bookings", reports.overview.cancelledBookings],
    ["Online Bookings", reports.overview.onlineBookings],
    ["Manual Bookings (Front Desk)", reports.overview.manualBookings],
  ]);

  addSummarySection("MONEY — HOW THE TOTAL IS CALCULATED", [
    ["Gross Booking Value (all bookings, before cancellations)", reports.overview.grossBookingValue],
    ["− Cancelled Booking Amount", -reports.overview.cancelledAmount],
    ["= Total Amount (net, what actually counts)", reports.overview.totalAmount],
    ["Collected Amount", finance.overview.collectedAmount],
    ["Pending / Remaining to Collect", finance.overview.pendingCollections],
    ["Advance Collected", finance.overview.advanceCollected],
    ["Offline Collections (Cash / UPI / Card)", finance.overview.offlineCollections],
    ["Online Collections (Razorpay)", finance.overview.onlineCollections],
    ["Average Booking Value", finance.overview.averageBookingValue],
    ["Occupancy Rate", `${reports.overview.occupancyRate}%`],
  ]);

  addSummarySection("RECONCILIATION (Total Amount should equal Collected + Pending)", [
    ["Expected Revenue", finance.reconciliation.expectedRevenue],
    ["Collected Revenue", finance.reconciliation.collectedRevenue],
    ["Outstanding Revenue", finance.reconciliation.outstandingRevenue],
    ["Discrepancy (should be 0)", finance.reconciliation.discrepancy],
    ["Has Discrepancy", finance.reconciliation.hasDiscrepancy ? "Yes — review Bookings sheet" : "No"],
  ]);

  summary.getColumn(2).numFmt = CURRENCY_FORMAT;
  // Percentage / text rows in column 2 shouldn't get a currency format —
  // ExcelJS applies numFmt only to actual numeric cells, so string values
  // ("Yes"/"No", "12%") are left untouched automatically.
  autoFitColumns(summary, [55, 18]);

  // ── Bookings ─────────────────────────────────────────────────────────
  const bookingsSheet = workbook.addWorksheet("Bookings");
  const bookingHeader = bookingsSheet.addRow([
    "Booking Reference",
    "Customer Name",
    "Phone",
    "Email",
    "Source",
    "Status",
    "Completed",
    "Booking Date",
    "Start Time",
    "End Time",
    "Duration (min)",
    "Total Amount",
    "Advance Amount",
    "Advance Method",
    "Advance Reference",
    "Balance Due",
    "Balance Paid",
    "Balance Status",
    "Balance Method",
    "Balance Reference",
    "Notes",
  ]);
  styleHeaderRow(bookingHeader);
  for (const booking of finance.bookingDetails) {
    bookingsSheet.addRow([
      booking.bookingReference,
      booking.customerName,
      booking.customerPhone,
      booking.customerEmail,
      booking.source === "manual" ? "Manual (Front Desk)" : "Online",
      booking.status,
      booking.isCompleted ? "Yes" : "No",
      booking.bookingDate,
      booking.startTime,
      booking.endTime,
      booking.durationMinutes,
      booking.totalPrice,
      booking.advanceAmount,
      booking.advanceMethod,
      booking.advanceReferenceId ?? "",
      booking.balanceDue,
      booking.balancePaidAmount,
      booking.balanceStatus,
      booking.balanceMethod,
      booking.balanceReferenceId ?? "",
      booking.notes ?? "",
    ]);
  }
  [12, 13, 16, 17].forEach((colIndex) => {
    bookingsSheet.getColumn(colIndex).numFmt = CURRENCY_FORMAT;
  });
  autoFitColumns(bookingsSheet, Array(21).fill(14));

  // ── Transactions ─────────────────────────────────────────────────────
  const txnSheet = workbook.addWorksheet("Transactions");
  txnSheet.addRow([
    "Cancelled bookings' payments are excluded from this ledger — see the Bookings sheet for a cancelled booking's original amount.",
  ]);
  txnSheet.mergeCells(1, 1, 1, 9);
  txnSheet.getCell(1, 1).font = SUBTITLE_FONT;
  const txnHeader = txnSheet.addRow([
    "Date",
    "Booking",
    "Customer",
    "Amount",
    "Method",
    "Type",
    "Collected By",
    "Reference",
    "Status",
  ]);
  styleHeaderRow(txnHeader);
  for (const txn of finance.transactions) {
    txnSheet.addRow([
      new Date(txn.createdAt).toLocaleString("en-IN"),
      txn.bookingReference,
      txn.customerName,
      txn.amount,
      formatTxnMethod(txn),
      txn.type,
      txn.collectedBy ?? "",
      txn.referenceNumber ?? "",
      txn.status,
    ]);
  }
  txnSheet.getColumn(4).numFmt = CURRENCY_FORMAT;
  autoFitColumns(txnSheet, [20, 16, 18, 12, 10, 10, 14, 16, 12]);

  // ── Payment Breakdown ────────────────────────────────────────────────
  const breakdownSheet = workbook.addWorksheet("Payment Breakdown");
  const breakdownHeader = breakdownSheet.addRow(["Method", "Amount", "Transaction Count", "Share"]);
  styleHeaderRow(breakdownHeader);
  for (const item of finance.paymentBreakdown) {
    breakdownSheet.addRow([item.method, item.amount, item.count, `${item.percentage}%`]);
  }
  breakdownSheet.getColumn(2).numFmt = CURRENCY_FORMAT;
  autoFitColumns(breakdownSheet, [18, 14, 18, 10]);

  // ── Pending Collections ──────────────────────────────────────────────
  const pendingSheet = workbook.addWorksheet("Pending Collections");
  const pendingHeader = pendingSheet.addRow([
    "Booking Reference",
    "Customer",
    "Phone",
    "Outstanding",
    "Booking Date",
    "Time",
  ]);
  styleHeaderRow(pendingHeader);
  for (const booking of finance.pendingBookings) {
    pendingSheet.addRow([
      booking.bookingReference,
      booking.customerName,
      booking.customerPhone,
      booking.outstanding,
      booking.bookingDate,
      booking.startTime,
    ]);
  }
  pendingSheet.getColumn(4).numFmt = CURRENCY_FORMAT;
  autoFitColumns(pendingSheet, [18, 18, 14, 14, 14, 10]);

  // ── Daily Trends ─────────────────────────────────────────────────────
  const trendsSheet = workbook.addWorksheet("Daily Trends");
  const trendsHeader = trendsSheet.addRow([
    "Date",
    "Bookings Made",
    "Net Collections",
    "Pending Outstanding",
  ]);
  styleHeaderRow(trendsHeader);
  const trendLength = Math.max(
    reports.bookingsPerDay.length,
    finance.revenueTrend.length,
    finance.pendingCollectionsTrend.length,
  );
  for (let i = 0; i < trendLength; i++) {
    trendsSheet.addRow([
      reports.bookingsPerDay[i]?.label ?? finance.revenueTrend[i]?.label ?? "",
      reports.bookingsPerDay[i]?.value ?? 0,
      finance.revenueTrend[i]?.value ?? 0,
      finance.pendingCollectionsTrend[i]?.value ?? 0,
    ]);
  }
  trendsSheet.getColumn(3).numFmt = CURRENCY_FORMAT;
  trendsSheet.getColumn(4).numFmt = CURRENCY_FORMAT;
  autoFitColumns(trendsSheet, [14, 16, 18, 18]);

  // ── Occupancy ────────────────────────────────────────────────────────
  const occupancySheet = workbook.addWorksheet("Occupancy");
  const occHeader = occupancySheet.addRow(["Metric", "Value"]);
  styleHeaderRow(occHeader);
  occupancySheet.addRow(["Available Slots", reports.occupancy.availableSlots]);
  occupancySheet.addRow(["Booked Slots", reports.occupancy.bookedSlots]);
  occupancySheet.addRow(["Blocked Slots", reports.occupancy.blockedSlots]);
  occupancySheet.addRow(["Maintenance Slots", reports.occupancy.maintenanceSlots]);
  occupancySheet.addRow(["Occupancy Rate", `${reports.occupancy.occupancyPercent}%`]);
  autoFitColumns(occupancySheet, [22, 14]);

  return workbook.xlsx.writeBuffer();
}
