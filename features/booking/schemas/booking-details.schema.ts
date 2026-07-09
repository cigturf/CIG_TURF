import { z } from "zod";

import { phoneSchema } from "@/lib/validations/common";

export const bookingDetailsProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phone: phoneSchema,
});

export type BookingDetailsProfileInput = z.infer<typeof bookingDetailsProfileSchema>;
