import { z } from "zod";

export const cancelBookingSchema = z
  .object({
    reason: z.string().trim().min(1, "Cancellation reason is required").max(500),
    issueRefund: z.boolean().optional().default(false),
  })
  .strict();

export type CancelBookingBody = z.infer<typeof cancelBookingSchema>;
