export type ReportDatePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_15_days"
  | "last_30_days"
  | "this_month"
  | "previous_month"
  | "custom";

export type ReportDateRange = {
  preset: ReportDatePreset;
  from: string;
  to: string;
  label: string;
};

export type ReportOverview = {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  manualBookings: number;
  onlineBookings: number;
  totalRevenue: number;
  advanceCollected: number;
  offlineCollections: number;
  pendingCollections: number;
  averageBookingValue: number;
  occupancyRate: number;
};

export type ReportSeriesPoint = {
  label: string;
  value: number;
};

export type ReportPaymentBreakdown = {
  method: string;
  amount: number;
  count: number;
  percentage: number;
};

export type ReportOccupancy = {
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  maintenanceSlots: number;
  occupancyPercent: number;
  heatmap: ReportSeriesPoint[];
};

export type ReportsAnalyticsData = {
  range: ReportDateRange;
  overview: ReportOverview;
  bookingsPerDay: ReportSeriesPoint[];
  bookingsPerHour: ReportSeriesPoint[];
  peakBookingTimes: ReportSeriesPoint[];
  popularSlots: ReportSeriesPoint[];
  popularDays: ReportSeriesPoint[];
  cancellationTrend: ReportSeriesPoint[];
  dailyRevenue: ReportSeriesPoint[];
  revenueTrend: ReportSeriesPoint[];
  advancePayments: ReportSeriesPoint[];
  offlinePayments: ReportSeriesPoint[];
  pendingPayments: ReportSeriesPoint[];
  paymentBreakdown: ReportPaymentBreakdown[];
  occupancy: ReportOccupancy;
  generatedAt: string;
};

export type ReportQuery = {
  preset?: ReportDatePreset;
  from?: string;
  to?: string;
};
