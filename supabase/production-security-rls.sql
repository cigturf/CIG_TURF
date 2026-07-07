-- Milestone 4.1 — Production Security Hardening (RLS)
-- Run in Supabase Dashboard → SQL Editor after existing schema files.
-- Safe to re-run.

-- ─── Shared admin helper ─────────────────────────────────────────────────────

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

-- ─── profiles ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─── admins (self read only) ─────────────────────────────────────────────────

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_self" ON public.admins;
CREATE POLICY "admins_select_self"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- ─── bookings ────────────────────────────────────────────────────────────────

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

-- ─── booking_sessions ────────────────────────────────────────────────────────

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

-- ─── payments ────────────────────────────────────────────────────────────────

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
CREATE POLICY "payments_select_admin"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─── payment_transactions (optional — skip if table does not exist) ───────────

DO $payment_transactions$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_transactions'
  ) THEN
    ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "payment_transactions_select_admin" ON public.payment_transactions;
    CREATE POLICY "payment_transactions_select_admin"
      ON public.payment_transactions
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user());
  END IF;
END
$payment_transactions$;

-- ─── pricing_rules ───────────────────────────────────────────────────────────

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_rules_select_admin" ON public.pricing_rules;
CREATE POLICY "pricing_rules_select_admin"
  ON public.pricing_rules
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─── business_settings (public read of default row) ──────────────────────────

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_settings_select_public" ON public.business_settings;
CREATE POLICY "business_settings_select_public"
  ON public.business_settings
  FOR SELECT
  TO authenticated, anon
  USING (id = 'default');

DROP POLICY IF EXISTS "business_settings_select_admin" ON public.business_settings;
CREATE POLICY "business_settings_select_admin"
  ON public.business_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─── booked_slots (availability only — no customer PII) ──────────────────────

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

-- ─── system_audit_logs ─────────────────────────────────────────────────────

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_audit_logs_select_admin" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_select_admin"
  ON public.system_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "system_audit_logs_insert_authenticated" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_insert_authenticated"
  ON public.system_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── customer_directory_notes (optional — skip if table does not exist) ────────

DO $customer_notes$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_directory_notes'
  ) THEN
    ALTER TABLE public.customer_directory_notes ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "customer_notes_select_admin" ON public.customer_directory_notes;
    CREATE POLICY "customer_notes_select_admin"
      ON public.customer_directory_notes
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user());
  END IF;
END
$customer_notes$;
