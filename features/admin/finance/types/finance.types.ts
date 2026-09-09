import type {
  BookingPaymentRecordType,
  BookingSource,
  OfflinePaymentMethod,
} from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingStatus } from "@/features/booking/types/booking-record.types";
import type { ReportDatePreset, ReportDateRange } from "@/features/admin/reports/types/reports.types";
import type { ReportPaymentBreakdown, ReportSeriesPoint } from "@/features/admin/reports/types/reports.types";

export type FinanceOverview = {
  totalAmount: number;
  collectedAmount: number;
  pendingCollections: number;
  advanceCollected: number;
  offlineCollections: number;
  onlineCollections: number;
  averageBookingValue: number;
};

export type FinancePendingBooking = {
  id: string;
  bookingReference: string;
  customerName: string;
  customerPhone: string;
  outstanding: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  advancePaid: number;
};

export type FinanceTransactionStatus = "completed" | "refunded";

export type FinanceTransaction = {
  id: string;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  startTime: string;
  amount: number;
  method: OfflinePaymentMethod;
  type: BookingPaymentRecordType;
  collectedBy: string | null;
  referenceNumber: string | null;
  notes: string | null;
  status: FinanceTransactionStatus;
  createdAt: string;
};

export type FinanceDailyClosing = {
  date: string;
  totalRevenue: number;
  cash: number;
  upi: number;
  card: number;
  razorpay: number;
  pending: number;
  completedBookings: number;
  cancelledBookings: number;
  manualBookings: number;
};

export type FinanceReconciliation = {
  expectedRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  discrepancy: number;
  hasDiscrepancy: boolean;
};

export type FinanceBookingCounts = {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  onlineBookings: number;
  onlineBookingsValue: number;
  manualBookings: number;
  manualBookingsValue: number;
};

export type FinanceBalanceStatus = "paid" | "pending" | "not_required";

export type FinanceBookingDetail = {
  bookingReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  source: BookingSource;
  status: BookingStatus;
  isCompleted: boolean;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  advanceAmount: number;
  advanceMethod: string;
  advanceReferenceId: string | null;
  balanceStatus: FinanceBalanceStatus;
  balanceDue: number;
  balancePaidAmount: number;
  balanceMethod: string;
  balanceReferenceId: string | null;
  notes: string | null;
};

export type FinanceDashboardData = {
  range: ReportDateRange;
  overview: FinanceOverview;
  paymentBreakdown: ReportPaymentBreakdown[];
  pendingBookings: FinancePendingBooking[];
  transactions: FinanceTransaction[];
  dailyClosing: FinanceDailyClosing;
  reconciliation: FinanceReconciliation;
  bookingCounts: FinanceBookingCounts;
  bookingDetails: FinanceBookingDetail[];
  revenueTrend: ReportSeriesPoint[];
  dailyCollections: ReportSeriesPoint[];
  pendingCollectionsTrend: ReportSeriesPoint[];
  generatedAt: string;
};

export type FinanceQuery = {
  preset?: ReportDatePreset;
  from?: string;
  to?: string;
  closingDate?: string;
};
