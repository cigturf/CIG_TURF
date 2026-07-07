-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Use when `npx prisma db push` cannot reach db.*.supabase.co from your network.
-- Safe to re-run: skips types/tables that already exist.

DO $$ BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('owner', 'admin', 'manager', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL UNIQUE,
  role       "AdminRole" NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_settings (
  id         TEXT PRIMARY KEY DEFAULT 'default',
  data       JSONB NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS business_settings_updated_at ON public.business_settings;
CREATE TRIGGER business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Milestone 1.5: Booking sessions & payments ─────────────────────────────

DO $$ BEGIN
  ALTER TYPE "BookingSessionStatus" ADD VALUE IF NOT EXISTS 'failed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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

DROP TRIGGER IF EXISTS booking_sessions_updated_at ON public.booking_sessions;
CREATE TRIGGER booking_sessions_updated_at
  BEFORE UPDATE ON public.booking_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Milestone 1.6: Bookings & slot finalization ────────────────────────────

DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'cancelled', 'completed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.bookings (
  id                 TEXT PRIMARY KEY,
  booking_reference  TEXT NOT NULL UNIQUE,
  user_id            TEXT NOT NULL,
  booking_session_id TEXT NOT NULL UNIQUE,
  payment_id         TEXT NOT NULL,
  booking_date       TEXT NOT NULL,
  start_time         TEXT NOT NULL,
  end_time           TEXT NOT NULL,
  selected_slots     JSONB NOT NULL,
  duration_minutes   INTEGER NOT NULL,
  total_price        INTEGER NOT NULL,
  advance_paid       INTEGER NOT NULL,
  remaining_amount   INTEGER NOT NULL,
  status             "BookingStatus" NOT NULL DEFAULT 'confirmed',
  customer_name      TEXT NOT NULL,
  customer_phone     TEXT NOT NULL,
  customer_email     TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
