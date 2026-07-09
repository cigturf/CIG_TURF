/** Fixed advance collected online — always ₹200 regardless of booking size. */
export const PAYMENT_ADVANCE_AMOUNT_INR = 200;

/** Razorpay amounts are in paise. */
export const PAYMENT_ADVANCE_AMOUNT_PAISE = PAYMENT_ADVANCE_AMOUNT_INR * 100;

/** Booking sessions older than this are treated as expired. */
export const BOOKING_SESSION_EXPIRY_HOURS = 24;

/** Active slot holds expire after this window (payment in progress). */
export const SLOT_HOLD_TTL_MINUTES = 2;

export const PAYMENT_CURRENCY = "INR";

/** Shown when selected slots were taken by another customer during checkout. */
export const SLOT_UNAVAILABLE_USER_MESSAGE =
  "This slot was just booked. Please choose another.";

/** Internal error when slot_holds unique constraint blocks a competing session. */
export const SLOT_HOLD_CONFLICT_ERROR =
  "One or more slots are currently held by another booking.";
