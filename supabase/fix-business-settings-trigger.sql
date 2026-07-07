-- Deprecated: use supabase/fix-timestamp-triggers.sql
-- Kept for backwards compatibility.

DROP TRIGGER IF EXISTS business_settings_updated_at ON public.business_settings;
