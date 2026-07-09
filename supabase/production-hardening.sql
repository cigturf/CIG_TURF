-- Production hardening — run in Supabase SQL Editor after existing schemas.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ─── Slot holds (payment window) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.slot_holds (
  id                  TEXT PRIMARY KEY,
  slot_id             TEXT NOT NULL UNIQUE,
  booking_session_id  TEXT NOT NULL REFERENCES public.booking_sessions(id) ON DELETE CASCADE,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slot_holds_session_idx ON public.slot_holds(booking_session_id);
CREATE INDEX IF NOT EXISTS slot_holds_expires_idx ON public.slot_holds(expires_at);

-- ─── Realtime: slot holds (payment window visibility) ────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_holds;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.slot_holds REPLICA IDENTITY FULL;
ALTER TABLE public.slot_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slot_holds_select_authenticated" ON public.slot_holds;
CREATE POLICY "slot_holds_select_authenticated"
  ON public.slot_holds
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "slot_holds_select_anon" ON public.slot_holds;
CREATE POLICY "slot_holds_select_anon"
  ON public.slot_holds
  FOR SELECT
  TO anon
  USING (true);

-- ─── Performance indexes ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS booked_slots_booking_id_idx ON public.booked_slots(booking_id);
CREATE INDEX IF NOT EXISTS payments_session_status_idx
  ON public.payments(booking_session_id, status);

-- ─── Audit log RLS: remove permissive authenticated INSERT ───────────────────

DROP POLICY IF EXISTS "system_audit_logs_insert_authenticated" ON public.system_audit_logs;
