/**
 * Business Settings type definitions.
 * All fields are nullable — values are loaded from the database, never hardcoded.
 */

export const SETTINGS_CATEGORIES = [
  "branding",
  "media",
  "contact",
  "emails",
  "booking",
  "pricing",
  "operations",
  "content",
] as const;

export type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number];

// ─── Shared primitives ───────────────────────────────────────────────────────

export type MediaAsset = {
  id: string;
  url: string | null;
  alt: string | null;
  sortOrder: number | null;
};

export type HeroVideo = MediaAsset & {
  posterUrl: string | null;
  autoplay: boolean | null;
  muted: boolean | null;
};

export type HeroImage = MediaAsset;

export type GalleryItem = MediaAsset & {
  caption: string | null;
};

export type FaqItem = {
  id: string;
  question: string | null;
  answer: string | null;
  sortOrder: number | null;
};

export type FooterLink = {
  label: string | null;
  url: string | null;
};

export type BookingRule = {
  id: string;
  title: string | null;
  description: string | null;
  sortOrder: number | null;
};

export type PricingTier = {
  id: string;
  name: string | null;
  description: string | null;
  pricePerHour: number | null;
  peakPricePerHour: number | null;
  sortOrder: number | null;
};

export type BusinessHoursEntry = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};

export type SocialMediaLinks = {
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  whatsapp: string | null;
  linkedin: string | null;
};

// ─── Category settings ───────────────────────────────────────────────────────

export type BrandingSettings = {
  businessName: string | null;
  shortName: string | null;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  themeAccentColor: string | null;
};

export type MediaSettings = {
  heroVideos: HeroVideo[] | null;
  heroImages: HeroImage[] | null;
  gallery: GalleryItem[] | null;
};

export type ContactSettings = {
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contactNumbers: string[] | null;
  /** @deprecated Legacy single field — use whatsappNumbers. Kept for DB migration only. */
  whatsappNumber?: string | null;
  whatsappNumbers: string[] | null;
  googleMapsLink: string | null;
  websiteUrl: string | null;
  socialMediaLinks: SocialMediaLinks;
};

export type EmailSettings = {
  fromName: string | null;
  replyToEmail: string | null;
  ownerNotificationEmails: string[] | null;
  bookingNotificationEmails: string[] | null;
  financeEmails: string[] | null;
  supportEmails: string[] | null;
  enableCustomerEmails: boolean | null;
  enableOwnerEmails: boolean | null;
};

export type BookingSettings = {
  rules: BookingRule[] | null;
  slotDurationMinutes: number | null;
  maxAdvanceBookingDays: number | null;
  minAdvanceBookingHours: number | null;
  cancellationWindowHours: number | null;
  maxPlayersPerSlot: number | null;
  allowGuestBooking: boolean | null;
  requireDeposit: boolean | null;
  advanceAmount: number | null;
};

export type PricingSettings = {
  currency: string | null;
  taxRatePercent: number | null;
  depositPercent: number | null;
  peakHourMultiplier: number | null;
  tiers: PricingTier[] | null;
};

export type OperationsSettings = {
  timezone: string | null;
  businessHours: BusinessHoursEntry[] | null;
  maintenanceMode: boolean | null;
  maintenanceMessage: string | null;
};

export type StatItem = {
  id: string;
  label: string | null;
  value: number | null;
  suffix: string | null;
  icon: string | null;
  sortOrder: number | null;
  visible: boolean | null;
};

export type SocialProofItem = {
  id: string;
  icon: string | null;
  title: string | null;
  description: string | null;
  sortOrder: number | null;
  visible: boolean | null;
};

export type EventItem = {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationLink: string | null;
  ctaLabel: string | null;
  sortOrder: number | null;
  visible: boolean | null;
};

export type ContentSettings = {
  footer: {
    tagline: string | null;
    copyrightText: string | null;
    links: FooterLink[] | null;
  };
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
  };
  legal: {
    privacyPolicy: string | null;
    terms: string | null;
    cancellationPolicy: string | null;
    refundPolicy: string | null;
  };
  faq: FaqItem[] | null;
  stats: StatItem[] | null;
  socialProof: SocialProofItem[] | null;
  events: EventItem[] | null;
};

export type BusinessSettingsMetadata = {
  version: number;
  updatedAt: string | null;
  language: string | null;
};

export type BusinessSettings = {
  branding: BrandingSettings;
  media: MediaSettings;
  contact: ContactSettings;
  emails: EmailSettings;
  booking: BookingSettings;
  pricing: PricingSettings;
  operations: OperationsSettings;
  content: ContentSettings;
  metadata: BusinessSettingsMetadata;
};

export type BusinessSettingsRecord = {
  id: string;
  data: BusinessSettings;
  version: number;
  updatedAt: Date;
};

/** Public-facing settings safe for client / landing page modules */
export type BusinessSettingsPublic = {
  branding: BrandingSettings;
  media: MediaSettings;
  contact: ContactSettings;
  booking: Pick<BookingSettings, "rules">;
  pricing: Pick<PricingSettings, "currency" | "tiers">;
  operations: Pick<
    OperationsSettings,
    "businessHours" | "maintenanceMode" | "maintenanceMessage" | "timezone"
  >;
  content: ContentSettings;
};

/** @deprecated Use BusinessHoursEntry */
export type OperatingHoursEntry = BusinessHoursEntry;
