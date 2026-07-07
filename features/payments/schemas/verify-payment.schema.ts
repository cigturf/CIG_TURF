import { z } from "zod";

export const verifyPaymentSchema = z
  .object({
    bookingSessionId: z.string().min(1).max(128),
    razorpay_order_id: z.string().min(1).max(128),
    razorpay_payment_id: z.string().min(1).max(128),
    razorpay_signature: z.string().min(1).max(256),
  })
  .strict();

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
