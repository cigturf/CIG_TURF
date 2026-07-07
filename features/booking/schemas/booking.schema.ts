import { z } from "zod";

export const bookingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const bookingSelectionSchema = z.object({
  dateIso: bookingDateSchema.nullable(),
  selectedSlotIds: z.array(z.string()).min(1, "Select at least one slot"),
});

export type BookingSelectionInput = z.infer<typeof bookingSelectionSchema>;
