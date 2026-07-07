-- Fix timestamp column / trigger mismatches (Prisma vs manual-schema.sql)
-- Run once in Supabase Dashboard → SQL Editor. Safe to re-run.
--
-- Fixes errors like:
--   record "new" has no field "updated_at"
-- on business_settings saves (all Business Settings sections).

-- ─── 1. Remove broken trigger (always safe) ─────────────────────────────────

DROP TRIGGER IF EXISTS business_settings_updated_at ON public.business_settings;

-- ─── 2. Normalize business_settings to snake_case timestamps ────────────────

DO $normalize_business_settings$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_settings'
      AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE public.business_settings RENAME COLUMN "createdAt" TO created_at;
    ALTER TABLE public.business_settings RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
END
$normalize_business_settings$;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── 3. Trigger function that supports snake_case OR Prisma camelCase ───────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updatedAt'
  ) THEN
    NEW."updatedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 4. Re-attach business_settings trigger only when snake_case exists ───────

DO $business_settings_trigger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_settings'
      AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS business_settings_updated_at ON public.business_settings;
    CREATE TRIGGER business_settings_updated_at
      BEFORE UPDATE ON public.business_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$business_settings_trigger$;
