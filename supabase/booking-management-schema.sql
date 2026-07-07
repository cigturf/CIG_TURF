-- Milestone 2.3 — Booking Management
-- Run in Supabase Dashboard → SQL Editor (safe to re-run where noted)

DO $$ BEGIN
  CREATE TYPE "BookingSource" AS ENUM ('online', 'manual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BookingPaymentRecordType" AS ENUM ('advance', 'remaining', 'refund', 'adjustment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OfflinePaymentMethod" AS ENUM ('cash', 'upi', 'card', 'other', 'online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source "BookingSource" NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS bookings_source_idx ON public.bookings(source);
CREATE INDEX IF NOT EXISTS bookings_customer_name_idx ON public.bookings(customer_name);
CREATE INDEX IF NOT EXISTS bookings_booking_reference_idx ON public.bookings(booking_reference);

CREATE TABLE IF NOT EXISTS public.booking_payment_records (
  id           TEXT PRIMARY KEY,
  booking_id   TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type         "BookingPaymentRecordType" NOT NULL,
  amount       INTEGER NOT NULL,
  method       "OfflinePaymentMethod" NOT NULL DEFAULT 'cash',
  collected_by TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_payment_records_booking_id_idx
  ON public.booking_payment_records(booking_id);

ALTER TABLE public.booking_payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_payment_records_select_admin" ON public.booking_payment_records;
CREATE POLICY "booking_payment_records_select_admin"
  ON public.booking_payment_records
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Realtime publication for payment collections
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_payment_records;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.booking_payment_records REPLICA IDENTITY FULL;
