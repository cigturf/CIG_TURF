-- Milestone 3.4 — System Audit Logs
-- Run in Supabase Dashboard → SQL Editor
--
-- Retention: application keeps only the last 3 days of audit logs (see audit-retention.ts).

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id              TEXT PRIMARY KEY,
  event_id        TEXT NOT NULL UNIQUE,
  action          TEXT NOT NULL,
  category        TEXT NOT NULL,
  module          TEXT NOT NULL,
  entity_id       TEXT,
  description     TEXT NOT NULL,
  performed_by    TEXT,
  performed_by_id TEXT,
  old_value       TEXT,
  new_value       TEXT,
  metadata        JSONB,
  booking_id      TEXT,
  customer_name   TEXT,
  ip_address      TEXT,
  browser         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS system_audit_logs_created_at_idx
  ON public.system_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS system_audit_logs_category_idx
  ON public.system_audit_logs(category);

CREATE INDEX IF NOT EXISTS system_audit_logs_action_idx
  ON public.system_audit_logs(action);

CREATE INDEX IF NOT EXISTS system_audit_logs_booking_id_idx
  ON public.system_audit_logs(booking_id);

CREATE INDEX IF NOT EXISTS system_audit_logs_customer_name_idx
  ON public.system_audit_logs(customer_name);

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_audit_logs_select_admin" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_select_admin"
  ON public.system_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "system_audit_logs_insert_service" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_insert_service"
  ON public.system_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.system_audit_logs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.system_audit_logs REPLICA IDENTITY FULL;
