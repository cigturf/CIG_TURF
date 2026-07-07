-- Milestone 1.6 — Bookings & slot finalization
-- Run in Supabase SQL Editor if not using prisma db push

DO $$ BEGIN
  ALTER TYPE "BookingSessionStatus" ADD VALUE IF NOT EXISTS 'failed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'cancelled', 'completed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.bookings (
  id                TEXT PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  user_id           TEXT NOT NULL,
  booking_session_id TEXT NOT NULL UNIQUE,
  payment_id        TEXT NOT NULL,
  booking_date      TEXT NOT NULL,
  start_time        TEXT NOT NULL,
  end_time          TEXT NOT NULL,
  selected_slots    JSONB NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  total_price       INTEGER NOT NULL,
  advance_paid      INTEGER NOT NULL,
  remaining_amount  INTEGER NOT NULL,
  status            "BookingStatus" NOT NULL DEFAULT 'confirmed',
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booked_slots (
  id           TEXT PRIMARY KEY,
  slot_id      TEXT NOT NULL UNIQUE,
  booking_id   TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_date TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_booking_date_idx ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS booked_slots_booking_date_idx ON public.booked_slots(booking_date);

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
