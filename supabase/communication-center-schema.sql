-- Milestone 4.3 - Communication Center (email logs)
-- Run in Supabase Dashboard -> SQL Editor (select ALL, then Run)

CREATE TABLE IF NOT EXISTS public.email_logs (
  id            TEXT PRIMARY KEY,
  recipient     TEXT NOT NULL,
  template      TEXT NOT NULL,
  subject       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued',
  retries       INTEGER NOT NULL DEFAULT 0,
  max_retries   INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  booking_id    TEXT,
  metadata      JSONB,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs (status);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_booking_id_idx ON public.email_logs (booking_id);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_select_admin" ON public.email_logs;
CREATE POLICY "email_logs_select_admin"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.email_logs REPLICA IDENTITY FULL;
