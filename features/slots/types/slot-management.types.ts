export type SlotBlockState = "blocked" | "maintenance";

export type SlotBlockRecord = {
  id: string;
  bookingDate: string; // YYYY-MM-DD
  slotId: string; // `${dateIso}-${startMinute}`
  state: SlotBlockState;
  reason: string | null;
  createdBy: string | null;
  createdAt: Date;
};

export type SlotHolidayRecord = {
  id: string;
  bookingDate: string; // YYYY-MM-DD
  label: string | null;
  createdBy: string | null;
  createdAt: Date;
};

export type SlotAvailabilitySnapshot = {
  bookedSlotIds: string[];
  heldSlotIds: string[];
  blockedSlotIds: string[];
  maintenanceSlotIds: string[];
  isHoliday: boolean;
};

