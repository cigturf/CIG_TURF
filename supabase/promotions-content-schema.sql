-- Milestone 2.8 — Promotions, Events & Website Content
-- Run in Supabase Dashboard → SQL Editor

DO $$ BEGIN
  CREATE TYPE "PromotionContentType" AS ENUM (
    'tournament',
    'coaching_camp',
    'practice_session',
    'special_offer',
    'announcement',
    'homepage_banner',
    'festival_offer',
    'general_promotion'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PromotionStatus" AS ENUM (
    'draft',
    'scheduled',
    'published',
    'expired',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PromotionDisplayLocation" AS ENUM (
    'landing_hero',
    'homepage_section',
    'popup',
    'announcement_bar',
    'events_section',
    'booking_page_banner'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.promotional_content (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  short_description   TEXT,
  full_description    TEXT,
  content_type        "PromotionContentType" NOT NULL DEFAULT 'general_promotion',
  status              "PromotionStatus" NOT NULL DEFAULT 'draft',
  banner_media_id     UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  gallery_media_ids   UUID[] NOT NULL DEFAULT '{}',
  cta_text            TEXT,
  cta_link            TEXT,
  start_at            TIMESTAMPTZ,
  end_at              TIMESTAMPTZ,
  priority            INTEGER NOT NULL DEFAULT 0,
  display_locations   "PromotionDisplayLocation"[] NOT NULL DEFAULT '{}',
  venue               TEXT,
  organizer           TEXT,
  contact_number      TEXT,
  registration_link   TEXT,
  max_participants    INTEGER,
  entry_fee           INTEGER,
  announcement_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by          UUID,
  updated_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotional_content_status ON public.promotional_content(status);
CREATE INDEX IF NOT EXISTS idx_promotional_content_type ON public.promotional_content(content_type);
CREATE INDEX IF NOT EXISTS idx_promotional_content_priority ON public.promotional_content(priority DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotional_content_schedule ON public.promotional_content(start_at, end_at);

ALTER TABLE public.promotional_content ENABLE ROW LEVEL SECURITY;

-- Public: only published + within schedule window
DROP POLICY IF EXISTS "promotional_content_select_public" ON public.promotional_content;
CREATE POLICY "promotional_content_select_public"
  ON public.promotional_content
  FOR SELECT
  TO anon, authenticated
  USING (
    status IN ('published', 'scheduled')
    AND (start_at IS NULL OR start_at <= NOW())
    AND (end_at IS NULL OR end_at >= NOW())
  );

-- Owner-only write access
DROP POLICY IF EXISTS "promotional_content_owner_all" ON public.promotional_content;
CREATE POLICY "promotional_content_owner_all"
  ON public.promotional_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid() AND a.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid() AND a.role = 'owner'
    )
  );

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.promotional_content;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.promotional_content REPLICA IDENTITY FULL;
