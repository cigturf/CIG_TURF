-- Milestone 3.3 — Customer Directory
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.customer_directory_notes (
  customer_key TEXT PRIMARY KEY,
  notes        TEXT,
  updated_by   TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customer_directory_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_notes_select_admin" ON public.customer_directory_notes;
CREATE POLICY "customer_notes_select_admin"
  ON public.customer_directory_notes
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "customer_notes_upsert_owner" ON public.customer_directory_notes;
CREATE POLICY "customer_notes_upsert_owner"
  ON public.customer_directory_notes
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_directory_notes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.customer_directory_notes REPLICA IDENTITY FULL;
