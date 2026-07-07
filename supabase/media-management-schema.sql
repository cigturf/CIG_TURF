-- Milestone 2.7 — Media Management
-- Run in Supabase Dashboard → SQL Editor (NOT TypeScript files)

DO $$ BEGIN
  CREATE TYPE "MediaAssetType" AS ENUM ('image', 'video', 'svg', 'logo', 'icon', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MediaVisibility" AS ENUM ('public', 'private', 'hidden');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MediaCategory" AS ENUM (
    'landing_hero',
    'gallery',
    'facilities',
    'tournament',
    'branding',
    'logos',
    'seo_images',
    'promotional_banners',
    'misc'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket           TEXT NOT NULL DEFAULT 'media',
  object_path      TEXT NOT NULL,
  filename         TEXT NOT NULL,
  type             "MediaAssetType" NOT NULL,
  category         "MediaCategory" NOT NULL DEFAULT 'misc',
  visibility       "MediaVisibility" NOT NULL DEFAULT 'public',
  alt_text         TEXT,
  caption          TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  mime_type        TEXT,
  size_bytes       BIGINT,
  width            INTEGER,
  height           INTEGER,
  duration_seconds NUMERIC,
  checksum_sha256  TEXT,
  uploaded_by      UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON public.media_assets(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_media_assets_visibility ON public.media_assets(visibility);
CREATE INDEX IF NOT EXISTS idx_media_assets_deleted_at ON public.media_assets(deleted_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_assets_object ON public.media_assets(bucket, object_path);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public website: only public + not deleted
DROP POLICY IF EXISTS "media_assets_select_public" ON public.media_assets;
CREATE POLICY "media_assets_select_public"
  ON public.media_assets
  FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public' AND deleted_at IS NULL);

-- Admin: full access
DROP POLICY IF EXISTS "media_assets_admin_all" ON public.media_assets;
CREATE POLICY "media_assets_admin_all"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_assets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.media_assets REPLICA IDENTITY FULL;

-- ─── Supabase Storage bucket ─────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  FALSE,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Admins can upload/manage objects in the media bucket
DROP POLICY IF EXISTS "media_storage_admin_select" ON storage.objects;
CREATE POLICY "media_storage_admin_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_user());

DROP POLICY IF EXISTS "media_storage_admin_insert" ON storage.objects;
CREATE POLICY "media_storage_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_admin_user());

DROP POLICY IF EXISTS "media_storage_admin_update" ON storage.objects;
CREATE POLICY "media_storage_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'media' AND public.is_admin_user());

DROP POLICY IF EXISTS "media_storage_admin_delete" ON storage.objects;
CREATE POLICY "media_storage_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_user());
