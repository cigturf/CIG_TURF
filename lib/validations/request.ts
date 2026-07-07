import { z } from "zod";

import { emailSchema, phoneSchema } from "@/lib/validations/common";

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

export const uuidSchema = z.string().uuid("Invalid identifier");

export const positiveIntSchema = z.number().int().positive();

export const nonNegativeIntSchema = z.number().int().nonnegative();

export const userIdSchema = z.string().min(1).max(128);

export const profileNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(120, "Name is too long");

export const noteTextSchema = z
  .string()
  .trim()
  .min(1, "Note cannot be empty")
  .max(2000, "Note is too long");

export const promotionTextSchema = z.string().trim().min(1).max(5000);

export const strictObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

export const authUserIdBodySchema = strictObject({
  userId: userIdSchema,
});

export const authEmailBodySchema = strictObject({
  email: emailSchema,
});

export const bookingSessionIdBodySchema = strictObject({
  bookingSessionId: z.string().min(1).max(128),
});

export { emailSchema, phoneSchema };
