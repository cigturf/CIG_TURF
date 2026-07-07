-- Milestone 2.4 — Smart Slot Management
-- Run in Supabase Dashboard → SQL Editor

DO $$ BEGIN
  CREATE TYPE "SlotBlockState" AS ENUM ('blocked', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.slot_blocks (
  id           TEXT PRIMARY KEY,
  booking_date TEXT NOT NULL,
  slot_id      TEXT NOT NULL,
  state        "SlotBlockState" NOT NULL DEFAULT 'blocked',
  reason       TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slot_blocks_unique_slot_per_day UNIQUE (booking_date, slot_id)
);

CREATE INDEX IF NOT EXISTS slot_blocks_booking_date_idx ON public.slot_blocks(booking_date);

CREATE TABLE IF NOT EXISTS public.slot_holidays (
  id           TEXT PRIMARY KEY,
  booking_date TEXT NOT NULL UNIQUE,
  label        TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slot_holidays_booking_date_idx ON public.slot_holidays(booking_date);

ALTER TABLE public.slot_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slot_blocks_select_admin" ON public.slot_blocks;
CREATE POLICY "slot_blocks_select_admin"
  ON public.slot_blocks
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "slot_holidays_select_admin" ON public.slot_holidays;
CREATE POLICY "slot_holidays_select_admin"
  ON public.slot_holidays
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_blocks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_holidays;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.slot_blocks REPLICA IDENTITY FULL;
ALTER TABLE public.slot_holidays REPLICA IDENTITY FULL;

