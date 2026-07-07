-- Pricing override rules v2 — named rules with date range + multiple time bands
-- Run in Supabase Dashboard → SQL Editor after smart-pricing-engine-schema.sql

DO $$ BEGIN
  ALTER TYPE "PricingRuleType" ADD VALUE IF NOT EXISTS 'override';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.pricing_rules
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS bands JSONB;

COMMENT ON COLUMN public.pricing_rules.name IS 'Display name for override rules';
COMMENT ON COLUMN public.pricing_rules.bands IS 'Array of {startMinute, endMinute, price} for override rules';
