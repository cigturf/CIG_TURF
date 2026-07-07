-- Milestone 2.3.5 — Booking Operations & Settlement
-- Run in Supabase Dashboard → SQL Editor (safe to re-run where noted)

DO $$ BEGIN
  ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'arrived';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'in_progress';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "OfflinePaymentMethod" ADD VALUE IF NOT EXISTS 'bank_transfer';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS match_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS match_completed_at TIMESTAMPTZ;

ALTER TABLE public.booking_payment_records
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

CREATE TABLE IF NOT EXISTS public.booking_audit_logs (
  id          TEXT PRIMARY KEY,
  booking_id  TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id    TEXT,
  actor_email TEXT,
  action      TEXT NOT NULL,
  field_name  TEXT,
  old_value   TEXT,
  new_value   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_audit_logs_booking_id_idx
  ON public.booking_audit_logs(booking_id);

CREATE INDEX IF NOT EXISTS booking_audit_logs_created_at_idx
  ON public.booking_audit_logs(created_at DESC);

ALTER TABLE public.booking_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_audit_logs_select_admin" ON public.booking_audit_logs;
CREATE POLICY "booking_audit_logs_select_admin"
  ON public.booking_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());
