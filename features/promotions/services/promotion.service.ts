import type {
  PromotionDisplayLocation,
  PromotionPublic,
  PromotionRecord,
  PromotionStatus,
} from "@/features/promotions/types";
import { listPromotions } from "@/features/promotions/services/promotion.repository";

export function resolveEffectiveStatus(
  record: Pick<PromotionRecord, "status" | "startAt" | "endAt">,
  now = new Date(),
): PromotionStatus {
  if (record.status === "archived" || record.status === "draft") {
    return record.status;
  }

  const start = record.startAt ? new Date(record.startAt) : null;
  const end = record.endAt ? new Date(record.endAt) : null;

  if (end && end < now) return "expired";
  if (start && start > now) {
    return record.status === "scheduled" ? "scheduled" : "scheduled";
  }

  if (record.status === "scheduled" || record.status === "published") {
    return "published";
  }

  if (record.status === "expired") return "expired";
  return record.status;
}

export function isPromotionPubliclyVisible(
  record: PromotionRecord,
  location?: PromotionDisplayLocation,
  now = new Date(),
): boolean {
  const effective = resolveEffectiveStatus(record, now);
  if (effective !== "published") return false;
  if (location && !record.displayLocations.includes(location)) return false;
  return true;
}

export function toPromotionPublic(record: PromotionRecord, now = new Date()): PromotionPublic {
  return {
    ...record,
    effectiveStatus: resolveEffectiveStatus(record, now),
    bannerSrc: record.bannerMediaId ? `/api/media/${record.bannerMediaId}` : null,
  };
}

export async function listPublicPromotions(
  location?: PromotionDisplayLocation,
): Promise<PromotionPublic[]> {
  const records = await listPromotions({ status: "all" });
  const now = new Date();

  return records
    .filter((record) => isPromotionPubliclyVisible(record, location, now))
    .map((record) => toPromotionPublic(record, now))
    .sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt));
}

export async function getActiveAnnouncement(): Promise<PromotionPublic | null> {
  const items = await listPublicPromotions("announcement_bar");
  return items.find((item) => item.announcementEnabled) ?? items[0] ?? null;
}
