import type { PaymentRecord, PaymentStatus } from "@/features/payments/types/payment.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

type PaymentRow = {
  id: string;
  booking_session_id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
};

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    bookingSessionId: row.booking_session_id,
    userId: row.user_id,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getPaymentByOrderId(
  razorpayOrderId: string,
): Promise<PaymentRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (!error && data) {
      return mapPayment(data as PaymentRow);
    }

    if (error) {
      console.error("[Payment] Supabase lookup failed:", error.message);
    }
  }

  try {
    const row = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });
    if (!row) return null;

    return {
      id: row.id,
      bookingSessionId: row.bookingSessionId,
      userId: row.userId,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[Payment] Prisma lookup failed:", error);
    return null;
  }
}

export async function createPaymentRecord(data: {
  bookingSessionId: string;
  userId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}): Promise<PaymentRecord> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const id = randomUUID();
    const payload = {
      id,
      booking_session_id: data.bookingSessionId,
      user_id: data.userId,
      razorpay_order_id: data.razorpayOrderId,
      amount: data.amount,
      currency: data.currency,
      status: "created" as const,
      created_at: now,
      updated_at: now,
    };

    const { data: row, error } = await supabase
      .from("payments")
      .insert(payload)
      .select("*")
      .single();

    if (!error && row) {
      return mapPayment(row as PaymentRow);
    }

    if (error) {
      console.error("[Payment] Supabase insert failed:", error);
      throw new Error(
        `Supabase payment insert failed: ${error.message} (code: ${error.code ?? "unknown"})`,
      );
    }

    throw new Error("Supabase payment insert failed: no row returned");
  }

  try {
    const row = await prisma.payment.create({
      data: {
        bookingSessionId: data.bookingSessionId,
        userId: data.userId,
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency,
        status: "created",
      },
    });

    return {
      id: row.id,
      bookingSessionId: row.bookingSessionId,
      userId: row.userId,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[Payment] Prisma insert failed:", error);
    throw error;
  }
}

export async function getPaymentByRazorpayPaymentId(
  razorpayPaymentId: string,
): Promise<PaymentRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_payment_id", razorpayPaymentId)
      .maybeSingle();

    if (!error && data) {
      return mapPayment(data as PaymentRow);
    }
  }

  try {
    const row = await prisma.payment.findFirst({
      where: { razorpayPaymentId },
    });
    if (!row) return null;

    return {
      id: row.id,
      bookingSessionId: row.bookingSessionId,
      userId: row.userId,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function markPaymentPaid(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentMethod?: string | null;
}): Promise<PaymentRecord | null> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data: row, error } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id: data.razorpayPaymentId,
        status: "paid",
        payment_method: data.paymentMethod ?? null,
        updated_at: now,
      })
      .eq("razorpay_order_id", data.razorpayOrderId)
      .in("status", ["created", "paid"])
      .select("*")
      .single();

    if (!error && row) {
      return mapPayment(row as PaymentRow);
    }

    if (error) {
      console.error("[Payment] Supabase paid update failed:", error.message);
    }
  }

  try {
    const row = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: data.razorpayOrderId,
        status: { in: ["created", "paid"] },
      },
      data: {
        razorpayPaymentId: data.razorpayPaymentId,
        status: "paid",
        paymentMethod: data.paymentMethod ?? null,
      },
    });

    if (row.count === 0) return null;

    return getPaymentByOrderId(data.razorpayOrderId);
  } catch (error) {
    console.error("[Payment] Prisma paid update failed:", error);
    return null;
  }
}

export async function getPaidPaymentBySessionId(
  bookingSessionId: string,
): Promise<PaymentRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_session_id", bookingSessionId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return mapPayment(data as PaymentRow);
    }
  }

  try {
    const row = await prisma.payment.findFirst({
      where: { bookingSessionId, status: "paid" },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;

    return {
      id: row.id,
      bookingSessionId: row.bookingSessionId,
      userId: row.userId,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return mapPayment(data as PaymentRow);
    }
  }

  try {
    const row = await prisma.payment.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      bookingSessionId: row.bookingSessionId,
      userId: row.userId,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getActivePaymentBySessionId(
  bookingSessionId: string,
): Promise<PaymentRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_session_id", bookingSessionId)
      .eq("status", "created")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return mapPayment(data as PaymentRow);
    }
  }

  try {
    const row = await prisma.payment.findFirst({
      where: { bookingSessionId, status: "created" },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;

    return {
      id: row.id,
      bookingSessionId: row.bookingSessionId,
      userId: row.userId,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function markPaymentFailed(razorpayOrderId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from("payments")
      .update({ status: "failed", updated_at: now })
      .eq("razorpay_order_id", razorpayOrderId)
      .in("status", ["created"]);

    if (!error) return;

    console.error("[Payment] Supabase failed update:", error.message);
  }

  try {
    await prisma.payment.updateMany({
      where: { razorpayOrderId, status: "created" },
      data: { status: "failed" },
    });
  } catch (error) {
    console.error("[Payment] Prisma failed update:", error);
  }
}

export async function markPaymentCancelled(razorpayOrderId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from("payments")
      .update({ status: "cancelled", updated_at: now })
      .eq("razorpay_order_id", razorpayOrderId)
      .in("status", ["created"]);

    if (!error) return;

    console.error("[Payment] Supabase cancelled update:", error.message);
  }

  try {
    await prisma.payment.updateMany({
      where: { razorpayOrderId, status: "created" },
      data: { status: "cancelled" },
    });
  } catch (error) {
    console.error("[Payment] Prisma cancelled update:", error);
  }
}
