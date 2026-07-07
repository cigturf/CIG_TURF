-- Milestone 1.5 only — run this if you already applied manual-schema.sql before.
-- Supabase Dashboard → SQL Editor → New query → Run

DO $$ BEGIN
  CREATE TYPE "BookingSessionStatus" AS ENUM (
    'pending',
    'payment_started',
    'payment_completed',
    'failed',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'created',
    'paid',
    'failed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.booking_sessions (
  id                     TEXT PRIMARY KEY,
  user_id                TEXT NOT NULL,
  selected_date          TEXT NOT NULL,
  selected_slots         JSONB NOT NULL,
  time_range             TEXT,
  slot_count             INTEGER NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  total_duration_label   TEXT NOT NULL,
  total_price            INTEGER NOT NULL,
  advance_amount         INTEGER NOT NULL,
  remaining_amount       INTEGER NOT NULL,
  profile_name           TEXT,
  profile_phone          TEXT,
  profile_email          TEXT,
  status                 "BookingSessionStatus" NOT NULL DEFAULT 'pending',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id                  TEXT PRIMARY KEY,
  booking_session_id  TEXT NOT NULL REFERENCES public.booking_sessions(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  razorpay_order_id   TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  amount              INTEGER NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              "PaymentStatus" NOT NULL DEFAULT 'created',
  payment_method      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_sessions_user_id_idx ON public.booking_sessions(user_id);
CREATE INDEX IF NOT EXISTS payments_booking_session_id_idx ON public.payments(booking_session_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updatedAt'
  ) THEN
    NEW."updatedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_sessions_updated_at ON public.booking_sessions;
CREATE TRIGGER booking_sessions_updated_at
  BEFORE UPDATE ON public.booking_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
