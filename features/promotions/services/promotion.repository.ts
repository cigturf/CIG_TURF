import type {
  PromotionDisplayLocation,
  PromotionInput,
  PromotionListQuery,
  PromotionRecord,
} from "@/features/promotions/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type PromotionRow = {
  id: string;
  title: string;
  short_description: string | null;
  full_description: string | null;
  content_type: string;
  status: string;
  banner_media_id: string | null;
  gallery_media_ids: string[] | null;
  cta_text: string | null;
  cta_link: string | null;
  start_at: string | null;
  end_at: string | null;
  priority: number;
  display_locations: string[] | null;
  venue: string | null;
  organizer: string | null;
  contact_number: string | null;
  registration_link: string | null;
  max_participants: number | null;
  entry_fee: number | null;
  announcement_enabled: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: PromotionRow): PromotionRecord {
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    contentType: row.content_type as PromotionRecord["contentType"],
    status: row.status as PromotionRecord["status"],
    bannerMediaId: row.banner_media_id,
    galleryMediaIds: row.gallery_media_ids ?? [],
    ctaText: row.cta_text,
    ctaLink: row.cta_link,
    startAt: row.start_at,
    endAt: row.end_at,
    priority: row.priority,
    displayLocations: (row.display_locations ?? []) as PromotionDisplayLocation[],
    venue: row.venue,
    organizer: row.organizer,
    contactNumber: row.contact_number,
    registrationLink: row.registration_link,
    maxParticipants: row.max_participants,
    entryFee: row.entry_fee,
    announcementEnabled: row.announcement_enabled,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbPayload(
  input: Partial<PromotionInput> & { updatedBy?: string | null; createdBy?: string | null },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.shortDescription !== undefined) payload.short_description = input.shortDescription;
  if (input.fullDescription !== undefined) payload.full_description = input.fullDescription;
  if (input.contentType !== undefined) payload.content_type = input.contentType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.bannerMediaId !== undefined) payload.banner_media_id = input.bannerMediaId;
  if (input.galleryMediaIds !== undefined) payload.gallery_media_ids = input.galleryMediaIds;
  if (input.ctaText !== undefined) payload.cta_text = input.ctaText;
  if (input.ctaLink !== undefined) payload.cta_link = input.ctaLink;
  if (input.startAt !== undefined) payload.start_at = input.startAt;
  if (input.endAt !== undefined) payload.end_at = input.endAt;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.displayLocations !== undefined) payload.display_locations = input.displayLocations;
  if (input.venue !== undefined) payload.venue = input.venue;
  if (input.organizer !== undefined) payload.organizer = input.organizer;
  if (input.contactNumber !== undefined) payload.contact_number = input.contactNumber;
  if (input.registrationLink !== undefined) payload.registration_link = input.registrationLink;
  if (input.maxParticipants !== undefined) payload.max_participants = input.maxParticipants;
  if (input.entryFee !== undefined) payload.entry_fee = input.entryFee;
  if (input.announcementEnabled !== undefined) payload.announcement_enabled = input.announcementEnabled;
  if (input.updatedBy !== undefined) payload.updated_by = input.updatedBy;
  if (input.createdBy !== undefined) payload.created_by = input.createdBy;
  return payload;
}

function isPromotionsTableMissingError(error: { message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("promotional_content") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("could not find the table"))
  );
}

function assertPromotionsTableAvailable(error: { message?: string }): void {
  if (isPromotionsTableMissingError(error)) {
    throw new Error(
      "Promotions are not set up yet. Run supabase/promotions-content-schema.sql in Supabase.",
    );
  }
  throw new Error(error.message ?? "Promotions query failed");
}

export async function listPromotions(query: PromotionListQuery = {}): Promise<PromotionRecord[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  let q = supabase.from("promotional_content").select("*");

  if (query.contentType && query.contentType !== "all") {
    q = q.eq("content_type", query.contentType);
  }
  if (query.status && query.status !== "all") {
    q = q.eq("status", query.status);
  }
  if (query.displayLocation && query.displayLocation !== "all") {
    q = q.contains("display_locations", [query.displayLocation]);
  }
  if (query.search?.trim()) {
    const s = query.search.trim();
    q = q.or(`title.ilike.%${s}%,short_description.ilike.%${s}%`);
  }

  const { data, error } = await q
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    if (isPromotionsTableMissingError(error)) return [];
    throw new Error(error.message);
  }

  return (data as PromotionRow[]).map(mapRow);
}

export async function getPromotionById(id: string): Promise<PromotionRecord | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  const { data, error } = await supabase
    .from("promotional_content")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isPromotionsTableMissingError(error)) return null;
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapRow(data as PromotionRow);
}

export async function createPromotion(
  input: PromotionInput,
  actorId: string,
): Promise<PromotionRecord> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  const payload = toDbPayload({ ...input, createdBy: actorId, updatedBy: actorId });

  const { data, error } = await supabase
    .from("promotional_content")
    .insert(payload)
    .select("*")
    .single();

  if (error) assertPromotionsTableAvailable(error);
  return mapRow(data as PromotionRow);
}

export async function updatePromotion(
  id: string,
  input: Partial<PromotionInput>,
  actorId: string,
): Promise<PromotionRecord> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase backend is not configured");

  const payload = toDbPayload({ ...input, updatedBy: actorId });

  const { data, error } = await supabase
    .from("promotional_content")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) assertPromotionsTableAvailable(error);
  return mapRow(data as PromotionRow);
}

export async function archivePromotion(id: string, actorId: string): Promise<PromotionRecord> {
  return updatePromotion(id, { status: "archived" }, actorId);
}
