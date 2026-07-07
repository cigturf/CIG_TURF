"use client";

import { useCallback } from "react";

import type { CreateOrderResponse, RazorpayCheckoutSuccess } from "@/features/payments/types/payment.types";
import { loadRazorpayScript } from "@/features/payments/utils/load-razorpay";
import { env } from "@/lib/env";

type OpenCheckoutParams = {
  order: CreateOrderResponse;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess: (response: RazorpayCheckoutSuccess) => void | Promise<void>;
  onDismiss: () => void;
  onFailure: (message: string) => void;
};

export function useRazorpayCheckout() {
  const openCheckout = useCallback(async (params: OpenCheckoutParams) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      params.onFailure("Unable to load payment gateway. Check your connection.");
      return;
    }

    const Razorpay = window.Razorpay;

    const rzp = new Razorpay({
      key: params.order.keyId,
      amount: params.order.amount,
      currency: params.order.currency,
      name: env.NEXT_PUBLIC_APP_NAME,
      description: "Booking advance payment",
      order_id: params.order.orderId,
      prefill: {
        name: params.customer.name,
        email: params.customer.email,
        contact: params.customer.phone,
      },
      theme: { color: "#16a34a" },
      handler: (response) => {
        void params.onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: params.onDismiss,
      },
    });

    rzp.on("payment.failed", (response) => {
      params.onFailure(response.error.description || "Payment failed. Please try again.");
    });

    rzp.open();
  }, []);

  return { openCheckout };
}
