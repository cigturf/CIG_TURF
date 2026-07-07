export type BookingSessionStatus =
  | "pending"
  | "payment_started"
  | "payment_completed"
  | "failed"
  | "expired";

export type PaymentStatus = "created" | "paid" | "failed" | "cancelled";

export type BookingSessionRecord = {
  id: string;
  userId: string;
  selectedDate: string;
  selectedSlots: string[];
  timeRange: string | null;
  slotCount: number;
  totalDurationMinutes: number;
  totalDurationLabel: string;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
  profileName: string | null;
  profilePhone: string | null;
  profileEmail: string | null;
  status: BookingSessionStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentRecord = {
  id: string;
  bookingSessionId: string;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingSessionId: string;
};

export type VerifyPaymentResponse = {
  success: true;
  bookingSessionId: string;
};

export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
