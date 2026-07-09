import type {
  BookingSessionRecord,
  BookingSessionStatus,
} from "@/features/payments/types/payment.types";
import { BOOKING_SESSION_EXPIRY_HOURS } from "@/features/payments/constants";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

type BookingSessionRow = {
  id: string;
  user_id: string;
  selected_date: string;
  selected_slots: string[];
  time_range: string | null;
  slot_count: number;
  total_duration_minutes: number;
  total_duration_label: string;
  total_price: number;
  advance_amount: number;
  remaining_amount: number;
  profile_name: string | null;
  profile_phone: string | null;
  profile_email: string | null;
  status: BookingSessionStatus;
  created_at: string;
  updated_at: string;
};

function mapBookingSession(row: BookingSessionRow): BookingSessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    selectedDate: row.selected_date,
    selectedSlots: row.selected_slots,
    timeRange: row.time_range,
    slotCount: row.slot_count,
    totalDurationMinutes: row.total_duration_minutes,
    totalDurationLabel: row.total_duration_label,
    totalPrice: row.total_price,
    advanceAmount: row.advance_amount,
    remainingAmount: row.remaining_amount,
    profileName: row.profile_name,
    profilePhone: row.profile_phone,
    profileEmail: row.profile_email,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getBookingSessionById(
  id: string,
): Promise<BookingSessionRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return mapBookingSession(data as BookingSessionRow);
    }

    if (error) {
      console.error("[BookingSession] Supabase lookup failed:", error.message);
    }
  }

  try {
    const row = await prisma.bookingSessionRecord.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      selectedDate: row.selectedDate,
      selectedSlots: row.selectedSlots as string[],
      timeRange: row.timeRange,
      slotCount: row.slotCount,
      totalDurationMinutes: row.totalDurationMinutes,
      totalDurationLabel: row.totalDurationLabel,
      totalPrice: row.totalPrice,
      advanceAmount: row.advanceAmount,
      remainingAmount: row.remainingAmount,
      profileName: row.profileName,
      profilePhone: row.profilePhone,
      profileEmail: row.profileEmail,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[BookingSession] Prisma lookup failed:", error);
    return null;
  }
}

export async function createBookingSession(data: {
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
  profileName: string;
  profilePhone: string;
  profileEmail: string;
}): Promise<BookingSessionRecord> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const id = randomUUID();
    const payload = {
      id,
      user_id: data.userId,
      selected_date: data.selectedDate,
      selected_slots: data.selectedSlots,
      time_range: data.timeRange,
      slot_count: data.slotCount,
      total_duration_minutes: data.totalDurationMinutes,
      total_duration_label: data.totalDurationLabel,
      total_price: data.totalPrice,
      advance_amount: data.advanceAmount,
      remaining_amount: data.remainingAmount,
      profile_name: data.profileName,
      profile_phone: data.profilePhone,
      profile_email: data.profileEmail,
      status: "pending" as const,
      created_at: now,
      updated_at: now,
    };

    const { data: row, error } = await supabase
      .from("booking_sessions")
      .insert(payload)
      .select("*")
      .single();

    if (!error && row) {
      return mapBookingSession(row as BookingSessionRow);
    }

    if (error) {
      console.error("[BookingSession] Supabase insert failed:", error.message);
    }
  }

  const row = await prisma.bookingSessionRecord.create({
    data: {
      userId: data.userId,
      selectedDate: data.selectedDate,
      selectedSlots: data.selectedSlots,
      timeRange: data.timeRange,
      slotCount: data.slotCount,
      totalDurationMinutes: data.totalDurationMinutes,
      totalDurationLabel: data.totalDurationLabel,
      totalPrice: data.totalPrice,
      advanceAmount: data.advanceAmount,
      remainingAmount: data.remainingAmount,
      profileName: data.profileName,
      profilePhone: data.profilePhone,
      profileEmail: data.profileEmail,
      status: "pending",
    },
  });

  return {
    id: row.id,
    userId: row.userId,
    selectedDate: row.selectedDate,
    selectedSlots: row.selectedSlots as string[],
    timeRange: row.timeRange,
    slotCount: row.slotCount,
    totalDurationMinutes: row.totalDurationMinutes,
    totalDurationLabel: row.totalDurationLabel,
    totalPrice: row.totalPrice,
    advanceAmount: row.advanceAmount,
    remainingAmount: row.remainingAmount,
    profileName: row.profileName,
    profilePhone: row.profilePhone,
    profileEmail: row.profileEmail,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateBookingSession(
  id: string,
  data: {
    selectedDate: string;
    selectedSlots: string[];
    timeRange: string | null;
    slotCount: number;
    totalDurationMinutes: number;
    totalDurationLabel: string;
    totalPrice: number;
    advanceAmount: number;
    remainingAmount: number;
    profileName: string;
    profilePhone: string;
    profileEmail: string;
  },
): Promise<BookingSessionRecord | null> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const payload = {
    selected_date: data.selectedDate,
    selected_slots: data.selectedSlots,
    time_range: data.timeRange,
    slot_count: data.slotCount,
    total_duration_minutes: data.totalDurationMinutes,
    total_duration_label: data.totalDurationLabel,
    total_price: data.totalPrice,
    advance_amount: data.advanceAmount,
    remaining_amount: data.remainingAmount,
    profile_name: data.profileName,
    profile_phone: data.profilePhone,
    profile_email: data.profileEmail,
    updated_at: now,
  };

  if (supabase) {
    const { data: row, error } = await supabase
      .from("booking_sessions")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (!error && row) {
      return mapBookingSession(row as BookingSessionRow);
    }

    if (error) {
      console.error("[BookingSession] Supabase content update failed:", error.message);
    }
  }

  try {
    const row = await prisma.bookingSessionRecord.update({
      where: { id },
      data: {
        selectedDate: data.selectedDate,
        selectedSlots: data.selectedSlots,
        timeRange: data.timeRange,
        slotCount: data.slotCount,
        totalDurationMinutes: data.totalDurationMinutes,
        totalDurationLabel: data.totalDurationLabel,
        totalPrice: data.totalPrice,
        advanceAmount: data.advanceAmount,
        remainingAmount: data.remainingAmount,
        profileName: data.profileName,
        profilePhone: data.profilePhone,
        profileEmail: data.profileEmail,
      },
    });

    return {
      id: row.id,
      userId: row.userId,
      selectedDate: row.selectedDate,
      selectedSlots: row.selectedSlots as string[],
      timeRange: row.timeRange,
      slotCount: row.slotCount,
      totalDurationMinutes: row.totalDurationMinutes,
      totalDurationLabel: row.totalDurationLabel,
      totalPrice: row.totalPrice,
      advanceAmount: row.advanceAmount,
      remainingAmount: row.remainingAmount,
      profileName: row.profileName,
      profilePhone: row.profilePhone,
      profileEmail: row.profileEmail,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[BookingSession] Prisma content update failed:", error);
    return null;
  }
}

export async function updateBookingSessionStatus(
  id: string,
  status: BookingSessionStatus,
): Promise<BookingSessionRecord | null> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data, error } = await supabase
      .from("booking_sessions")
      .update({ status, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) {
      return mapBookingSession(data as BookingSessionRow);
    }

    if (error) {
      console.error("[BookingSession] Supabase update failed:", error.message);
    }
  }

  try {
    const row = await prisma.bookingSessionRecord.update({
      where: { id },
      data: { status },
    });

    return {
      id: row.id,
      userId: row.userId,
      selectedDate: row.selectedDate,
      selectedSlots: row.selectedSlots as string[],
      timeRange: row.timeRange,
      slotCount: row.slotCount,
      totalDurationMinutes: row.totalDurationMinutes,
      totalDurationLabel: row.totalDurationLabel,
      totalPrice: row.totalPrice,
      advanceAmount: row.advanceAmount,
      remainingAmount: row.remainingAmount,
      profileName: row.profileName,
      profilePhone: row.profilePhone,
      profileEmail: row.profileEmail,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[BookingSession] Prisma update failed:", error);
    return null;
  }
}

export function isBookingSessionExpired(session: BookingSessionRecord): boolean {
  const expiryMs = BOOKING_SESSION_EXPIRY_HOURS * 60 * 60 * 1000;
  return Date.now() - session.createdAt.getTime() > expiryMs;
}
