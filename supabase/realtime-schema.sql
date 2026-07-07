-- Milestone 2.2.5 — Supabase Realtime infrastructure
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run where noted.

-- ─── Realtime publication ─────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.booked_slots;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.business_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Full row data for DELETE events on slot inventory
ALTER TABLE public.booked_slots REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- ─── RLS helper ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.user_id = auth.uid()::text
  );
$$;

-- ─── booked_slots (customer-safe availability) ───────────────────────────────

ALTER TABLE public.booked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booked_slots_select_authenticated" ON public.booked_slots;
CREATE POLICY "booked_slots_select_authenticated"
  ON public.booked_slots
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "booked_slots_select_anon" ON public.booked_slots;
CREATE POLICY "booked_slots_select_anon"
  ON public.booked_slots
  FOR SELECT
  TO anon
  USING (true);

-- ─── bookings ───────────────────────────────────────────────────────────────

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
CREATE POLICY "bookings_select_admin"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─── payments (admin-only realtime) ──────────────────────────────────────────

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
CREATE POLICY "payments_select_admin"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─── business_settings (public read for website + admin) ─────────────────────

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_settings_select_public" ON public.business_settings;
CREATE POLICY "business_settings_select_public"
  ON public.business_settings
  FOR SELECT
  TO authenticated, anon
  USING (id = 'default');

-- ─── booking_sessions (own + admin) ──────────────────────────────────────────

ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_sessions_select_own" ON public.booking_sessions;
CREATE POLICY "booking_sessions_select_own"
  ON public.booking_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "booking_sessions_select_admin" ON public.booking_sessions;
CREATE POLICY "booking_sessions_select_admin"
  ON public.booking_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());
