/** Slot availability from the booking engine */
export type SlotStatus =
  | "available"
  | "booked"
  | "blocked"
  | "maintenance"
  | "holiday"
  | "reserved"
  | "past";

export type BookingDateOption = {
  iso: string;
  day: string;
  date: string;
  month: string;
};

export type BookingSlot = {
  id: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  duration: number;
  timeLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  price: number;
  status: SlotStatus;
  isPast: boolean;
  isSelectable: boolean;
  isSelected: boolean;
};

export type BookingSelectionState = {
  dateIso: string | null;
  selectedSlotIds: string[];
};

/** Configurable operating window — times are 24h "HH:mm" strings */
export type BookingBusinessHours = {
  openTime: string;
  closeTime: string;
};

export type WeekendPricingConfig = {
  enabled: boolean;
  multiplier: number;
};

export type HolidayPricingConfig = {
  enabled: boolean;
  holidayDates: string[];
  multiplier: number;
};

export type PeakHourPricingConfig = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  multiplier: number;
};

/** Central booking engine configuration */
export type BookingEngineConfig = {
  slotDurationMinutes: number;
  businessHours: BookingBusinessHours;
  bookingWindowDays: number;
  fixedAdvanceAmount: number;
  defaultSlotPrice: number;
  currency: string;
  weekendPricing: WeekendPricingConfig;
  holidayPricing: HolidayPricingConfig;
  peakHourPricing: PeakHourPricingConfig;
  maxConsecutiveDurationMinutes: number;
  minBookingDurationMinutes: number;
  /** Early-morning slots on the next day offered for cross-midnight bookings */
  crossMidnightBridgeMinutes: number;
};

export type BookingSummary = {
  timeRange: string | null;
  slotCount: number;
  totalDurationMinutes: number;
  totalDurationLabel: string;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
};

/** @deprecated Use BookingSummary */
export type BookingPriceBreakdown = {
  totalTurfPrice: number;
  advanceAmount: number;
  remainingAmount: number;
};
