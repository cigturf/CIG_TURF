-- Supabase RLS architecture for CIG Turf Booking System
-- Apply via Supabase SQL editor or migration pipeline.
-- Policies are prepared for future enforcement; enable RLS when booking tables exist.

-- ─── Profiles ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Customers can read and update only their own profile.
-- CREATE POLICY "profiles_select_own"
--   ON public.profiles FOR SELECT
--   USING (auth.uid()::text = id);

-- CREATE POLICY "profiles_insert_own"
--   ON public.profiles FOR INSERT
--   WITH CHECK (auth.uid()::text = id);

-- CREATE POLICY "profiles_update_own"
--   ON public.profiles FOR UPDATE
--   USING (auth.uid()::text = id);

-- Admins can read all profiles.
-- CREATE POLICY "profiles_select_admin"
--   ON public.profiles FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()::text
--     )
--   );

-- ─── Admins ──────────────────────────────────────────────────────────────────

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only service role / server should manage admin records.
-- CREATE POLICY "admins_select_self"
--   ON public.admins FOR SELECT
--   USING (auth.uid()::text = user_id);

-- ─── Bookings (future) ───────────────────────────────────────────────────────

-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers: own bookings only.
-- CREATE POLICY "bookings_select_own"
--   ON public.bookings FOR SELECT
--   USING (auth.uid()::text = customer_id);

-- Admins: all bookings.
-- CREATE POLICY "bookings_select_admin"
--   ON public.bookings FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()::text
--     )
--   );

-- ─── Helper: admin login routing (optional) ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin_email(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    INNER JOIN auth.users u ON u.id::text = a.user_id
    WHERE lower(u.email) = lower(p_email)
  );
$$;
