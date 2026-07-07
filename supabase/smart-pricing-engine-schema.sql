-- Milestone 2.5 — Smart Pricing Engine
-- Run in Supabase Dashboard → SQL Editor

DO $$ BEGIN
  CREATE TYPE "PricingRuleType" AS ENUM ('default', 'range');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id           TEXT PRIMARY KEY,
  group_id     TEXT NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  type         "PricingRuleType" NOT NULL,
  price        INTEGER NOT NULL,
  start_minute INTEGER,
  end_minute   INTEGER,
  date_start   TEXT,
  date_end     TEXT,
  weekdays     INTEGER[],
  priority     INTEGER NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at  TIMESTAMPTZ,
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pricing_rules_active_priority_idx
  ON public.pricing_rules(active, priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS pricing_rules_date_range_idx
  ON public.pricing_rules(date_start, date_end);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_rules_select_admin" ON public.pricing_rules;
CREATE POLICY "pricing_rules_select_admin"
  ON public.pricing_rules
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_rules;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.pricing_rules REPLICA IDENTITY FULL;

-- Seed live default slot price (₹450) when none exists
INSERT INTO public.pricing_rules (
  id,
  group_id,
  version,
  type,
  price,
  priority,
  active
)
SELECT
  'default-slot-price',
  'default-slot-price',
  1,
  'default',
  450,
  0,
  TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM public.pricing_rules
  WHERE type = 'default' AND active = TRUE
);

