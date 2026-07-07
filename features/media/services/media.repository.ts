import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { MediaAssetRecord, MediaCategory, MediaListQuery, MediaVisibility } from "@/features/media/types";

type MediaAssetRow = {
  id: string;
  bucket: string;
  object_path: string;
  filename: string;
  type: string;
  category: string;
  visibility: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  checksum_sha256: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapRow(row: MediaAssetRow): MediaAssetRecord {
  return {
    id: row.id,
    bucket: row.bucket,
    objectPath: row.object_path,
    filename: row.filename,
    type: row.type as MediaAssetRecord["type"],
    category: row.category as MediaAssetRecord["category"],
    visibility: row.visibility as MediaAssetRecord["visibility"],
    altText: row.alt_text,
    caption: row.caption,
    sortOrder: row.sort_order,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    checksumSha256: row.checksum_sha256,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listMediaAssets(query: MediaListQuery = {}): Promise<MediaAssetRecord[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  let q = supabase.from("media_assets").select("*");

  if (query.category && query.category !== "all") q = q.eq("category", query.category);
  if (query.type && query.type !== "all") q = q.eq("type", query.type);
  if (query.visibility && query.visibility !== "all") q = q.eq("visibility", query.visibility);
  if (!query.includeDeleted) q = q.is("deleted_at", null);

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    q = q.or(`filename.ilike.%${s}%,caption.ilike.%${s}%,alt_text.ilike.%${s}%`);
  }

  const { data, error } = await q.order("category").order("sort_order").order("created_at", {
    ascending: false,
  });
  if (error) throw new Error(error.message);
  return (data as MediaAssetRow[]).map(mapRow);
}

export async function getMediaAssetById(id: string): Promise<MediaAssetRecord | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  const { data, error } = await supabase.from("media_assets").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as MediaAssetRow);
}

export async function createMediaAsset(input: {
  bucket: string;
  objectPath: string;
  filename: string;
  type: MediaAssetRecord["type"];
  category: MediaCategory;
  visibility: MediaVisibility;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  checksumSha256: string | null;
  uploadedBy: string | null;
  altText?: string | null;
  caption?: string | null;
}): Promise<MediaAssetRecord> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      bucket: input.bucket,
      object_path: input.objectPath,
      filename: input.filename,
      type: input.type,
      category: input.category,
      visibility: input.visibility,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      width: input.width,
      height: input.height,
      duration_seconds: input.durationSeconds,
      checksum_sha256: input.checksumSha256,
      uploaded_by: input.uploadedBy,
      alt_text: input.altText ?? null,
      caption: input.caption ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as MediaAssetRow);
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<{
    category: MediaCategory;
    visibility: MediaVisibility;
    altText: string | null;
    caption: string | null;
    sortOrder: number;
    deletedAt: string | null;
  }>,
): Promise<MediaAssetRecord> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  const payload: Record<string, unknown> = {};
  if (patch.category) payload.category = patch.category;
  if (patch.visibility) payload.visibility = patch.visibility;
  if ("altText" in patch) payload.alt_text = patch.altText;
  if ("caption" in patch) payload.caption = patch.caption;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  if ("deletedAt" in patch) payload.deleted_at = patch.deletedAt;

  const { data, error } = await supabase
    .from("media_assets")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as MediaAssetRow);
}

