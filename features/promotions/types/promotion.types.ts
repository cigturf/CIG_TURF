export type PromotionContentType =
  | "tournament"
  | "coaching_camp"
  | "practice_session"
  | "special_offer"
  | "announcement"
  | "homepage_banner"
  | "festival_offer"
  | "general_promotion";

export type PromotionStatus = "draft" | "scheduled" | "published" | "expired" | "archived";

export type PromotionDisplayLocation =
  | "landing_hero"
  | "homepage_section"
  | "popup"
  | "announcement_bar"
  | "events_section"
  | "booking_page_banner";

export type PromotionRecord = {
  id: string;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  contentType: PromotionContentType;
  status: PromotionStatus;
  bannerMediaId: string | null;
  galleryMediaIds: string[];
  ctaText: string | null;
  ctaLink: string | null;
  startAt: string | null;
  endAt: string | null;
  priority: number;
  displayLocations: PromotionDisplayLocation[];
  venue: string | null;
  organizer: string | null;
  contactNumber: string | null;
  registrationLink: string | null;
  maxParticipants: number | null;
  entryFee: number | null;
  announcementEnabled: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromotionPublic = PromotionRecord & {
  effectiveStatus: PromotionStatus;
  bannerSrc: string | null;
};

export type PromotionListQuery = {
  search?: string;
  contentType?: PromotionContentType | "all";
  status?: PromotionStatus | "all";
  displayLocation?: PromotionDisplayLocation | "all";
};

export type PromotionInput = Omit<
  PromotionRecord,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export const PROMOTION_CONTENT_TYPE_LABELS: Record<PromotionContentType, string> = {
  tournament: "Tournament",
  coaching_camp: "Coaching Camp",
  practice_session: "Practice Session",
  special_offer: "Special Offer",
  announcement: "Announcement",
  homepage_banner: "Homepage Banner",
  festival_offer: "Festival Offer",
  general_promotion: "General Promotion",
};

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  expired: "Expired",
  archived: "Archived",
};

export const PROMOTION_DISPLAY_LOCATION_LABELS: Record<PromotionDisplayLocation, string> = {
  landing_hero: "Landing Hero",
  homepage_section: "Homepage Section",
  popup: "Popup",
  announcement_bar: "Announcement Bar",
  events_section: "Events Section",
  booking_page_banner: "Booking Page Banner",
};
