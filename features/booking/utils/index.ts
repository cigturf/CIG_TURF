export {
  areConsecutiveIndices,
  BOOKING_MESSAGES,
  toggleConsecutiveSlot,
  validateConsecutiveSelection,
  type SlotSelectionResult,
} from "@/features/booking/utils/consecutive-slots";
export {
  calculateBookingSummary,
  mergeConsecutiveSlots,
} from "@/features/booking/utils/booking-summary";
export { formatSelectedTimeRange, formatTimeRange } from "@/features/booking/utils/format-time-range";
export { calculateBookingPrice, calculateRemainingAmount } from "@/features/booking/utils/pricing";
export {
  bookingSessionToSelection,
  clearBookingSession,
  hasBookingSession,
  readBookingSession,
  saveBookingSession,
  updateBookingSessionDbId,
  updateBookingSessionProfile,
} from "@/features/booking/utils/booking-session";
export {
  areConsecutiveSlotIds,
  getBookingDateRangeLabel,
  getBridgeDateIso,
  getNextDayBridgeEndMinute,
  selectionSpansMidnight,
  sortSlotIdsChronologically,
} from "@/features/booking/utils/slot-timeline";
export {
  countSlotsInWindow,
  createDateAtMinutes,
  formatDurationLabel,
  formatMinutesAsTime,
  formatSlotTimeRange,
  getOperatingWindow,
  getTodayIso,
  isPastSlot,
  isPastSlotEnd,
  parseTimeToMinutes,
} from "@/features/booking/utils/time";
