-- Milestone 4.2 — Production Performance Indexes
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run. Skips indexes for tables not yet created.

-- ─── Core booking tables ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_booking_date
  ON public.bookings (booking_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status_remaining
  ON public.bookings (status, remaining_amount)
  WHERE remaining_amount > 0;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone
  ON public.bookings (customer_phone);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at
  ON public.bookings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booked_slots_booking_date
  ON public.booked_slots (booking_date);

-- ─── Optional milestone tables ───────────────────────────────────────────────

DO $booking_payment_records$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_payment_records'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_booking_payment_records_created_at
      ON public.booking_payment_records (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_booking_payment_records_booking_id
      ON public.booking_payment_records (booking_id);
  END IF;
END
$booking_payment_records$;

DO $slot_management$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'slot_blocks'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_slot_blocks_booking_date
      ON public.slot_blocks (booking_date);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'slot_holidays'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_slot_holidays_booking_date
      ON public.slot_holidays (booking_date);
  END IF;
END
$slot_management$;

DO $pricing_rules$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pricing_rules'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pricing_rules_active
      ON public.pricing_rules (active)
      WHERE active = true;
  END IF;
END
$pricing_rules$;

DO $system_audit_logs$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'system_audit_logs'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at
      ON public.system_audit_logs (created_at DESC);
  END IF;
END
$system_audit_logs$;

DO $media_assets$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media_assets'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_media_assets_visibility_category
      ON public.media_assets (visibility, category)
      WHERE deleted_at IS NULL;
  END IF;
END
$media_assets$;

DO $promotional_content$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promotional_content'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_promotional_content_status
      ON public.promotional_content (status);
  END IF;
END
$promotional_content$;
