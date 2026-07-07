import { z } from "zod";

import { bookingDetailsProfileSchema } from "@/features/booking/schemas/booking-details.schema";
import { isoDateSchema, nonNegativeIntSchema, positiveIntSchema } from "@/lib/validations/request";

export const createOrderSchema = z
  .object({
    bookingSessionId: z.string().min(1).max(128).optional(),
    dateIso: isoDateSchema,
    selectedSlotIds: z.array(z.string().min(1).max(64)).min(1).max(32),
    timeRange: z.string().max(64).nullable(),
    slotCount: positiveIntSchema.max(32),
    totalDurationMinutes: positiveIntSchema.max(24 * 60),
    totalDurationLabel: z.string().min(1).max(64),
    totalPrice: nonNegativeIntSchema.max(1_000_000),
    advanceAmount: positiveIntSchema.max(1_000_000),
    remainingAmount: nonNegativeIntSchema.max(1_000_000),
    profile: bookingDetailsProfileSchema.extend({
      email: z.string().email().max(254),
    }),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
