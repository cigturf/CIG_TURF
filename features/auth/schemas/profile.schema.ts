import { z } from "zod";

import { emailSchema, phoneSchema } from "@/lib/validations/common";

export const profileCompletionSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  phone: phoneSchema,
  email: emailSchema,
});
