import { z } from "zod";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();
const nullableBoolean = z.boolean().nullable();
const nullableStringArray = z.array(z.string()).nullable();

const mediaAssetSchema = z.object({
  id: z.string(),
  url: nullableString,
  alt: nullableString,
  sortOrder: nullableNumber,
});

const heroVideoSchema = mediaAssetSchema.extend({
  posterUrl: nullableString,
  autoplay: nullableBoolean,
  muted: nullableBoolean,
});

const galleryItemSchema = mediaAssetSchema.extend({
  caption: nullableString,
});

const faqItemSchema = z.object({
  id: z.string(),
  question: nullableString,
  answer: nullableString,
  sortOrder: nullableNumber,
});

const footerLinkSchema = z.object({
  label: nullableString,
  url: nullableString,
});

const bookingRuleSchema = z.object({
  id: z.string(),
  title: nullableString,
  description: nullableString,
  sortOrder: nullableNumber,
});

const pricingTierSchema = z.object({
  id: z.string(),
  name: nullableString,
  description: nullableString,
  pricePerHour: nullableNumber,
  peakPricePerHour: nullableNumber,
  sortOrder: nullableNumber,
});

const businessHoursEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: nullableString,
  closeTime: nullableString,
  isClosed: z.boolean(),
});

const socialMediaLinksSchema = z.object({
  instagram: nullableString,
  facebook: nullableString,
  twitter: nullableString,
  youtube: nullableString,
  whatsapp: nullableString,
  linkedin: nullableString,
});

export const brandingSettingsSchema = z.object({
  businessName: nullableString,
  shortName: nullableString,
  tagline: nullableString,
  description: nullableString,
  logoUrl: nullableString,
  faviconUrl: nullableString,
  themeAccentColor: nullableString,
});

export const mediaSettingsSchema = z.object({
  heroVideos: z.array(heroVideoSchema).nullable(),
  heroImages: z.array(mediaAssetSchema).nullable(),
  gallery: z.array(galleryItemSchema).nullable(),
});

export const contactSettingsSchema = z
  .object({
    address: nullableString,
    city: nullableString,
    state: nullableString,
    pincode: nullableString,
    contactNumbers: nullableStringArray,
    whatsappNumber: nullableString,
    whatsappNumbers: nullableStringArray,
    googleMapsLink: nullableString,
    websiteUrl: nullableString,
    socialMediaLinks: socialMediaLinksSchema,
  })
  .transform((contact) => {
    const whatsappNumbers = resolveWhatsappNumbersFromRaw(contact);
    return {
      address: contact.address,
      city: contact.city,
      state: contact.state,
      pincode: contact.pincode,
      contactNumbers: contact.contactNumbers,
      whatsappNumbers,
      googleMapsLink: contact.googleMapsLink,
      websiteUrl: contact.websiteUrl,
      socialMediaLinks: contact.socialMediaLinks,
    };
  });

import { splitDelimitedContactValues } from "@/features/business-settings/lib/contact-utils";

function resolveWhatsappNumbersFromRaw(contact: {
  whatsappNumbers: string[] | null;
  whatsappNumber: string | null;
}): string[] | null {
  const fromArray = splitDelimitedContactValues(contact.whatsappNumbers);
  if (fromArray.length > 0) return fromArray;

  const legacy = contact.whatsappNumber?.trim();
  if (!legacy) return null;

  const fromLegacy = splitDelimitedContactValues([legacy]);
  return fromLegacy.length > 0 ? fromLegacy : null;
}

export const emailSettingsSchema = z.object({
  fromName: nullableString,
  replyToEmail: nullableString,
  ownerNotificationEmails: nullableStringArray,
  bookingNotificationEmails: nullableStringArray,
  financeEmails: nullableStringArray,
  supportEmails: nullableStringArray,
  enableCustomerEmails: nullableBoolean,
  enableOwnerEmails: nullableBoolean,
});

export const bookingSettingsSchema = z.object({
  rules: z.array(bookingRuleSchema).nullable(),
  slotDurationMinutes: nullableNumber,
  maxAdvanceBookingDays: nullableNumber,
  minAdvanceBookingHours: nullableNumber,
  cancellationWindowHours: nullableNumber,
  maxPlayersPerSlot: nullableNumber,
  allowGuestBooking: nullableBoolean,
  requireDeposit: nullableBoolean,
  advanceAmount: nullableNumber,
});

export const pricingSettingsSchema = z.object({
  currency: nullableString,
  taxRatePercent: nullableNumber,
  depositPercent: nullableNumber,
  peakHourMultiplier: nullableNumber,
  tiers: z.array(pricingTierSchema).nullable(),
});

export const operationsSettingsSchema = z.object({
  timezone: nullableString,
  businessHours: z.array(businessHoursEntrySchema).nullable(),
  maintenanceMode: nullableBoolean,
  maintenanceMessage: nullableString,
});

const statItemSchema = z.object({
  id: z.string(),
  label: nullableString,
  value: nullableNumber,
  suffix: nullableString,
  icon: nullableString,
  sortOrder: nullableNumber,
  visible: nullableBoolean,
});

const socialProofItemSchema = z.object({
  id: z.string(),
  icon: nullableString,
  title: nullableString,
  description: nullableString,
  sortOrder: nullableNumber,
  visible: nullableBoolean,
});

const eventItemSchema = z.object({
  id: z.string(),
  title: nullableString,
  subtitle: nullableString,
  description: nullableString,
  bannerImageUrl: nullableString,
  startDate: nullableString,
  endDate: nullableString,
  registrationLink: nullableString,
  ctaLabel: nullableString,
  sortOrder: nullableNumber,
  visible: nullableBoolean,
});

export const contentSettingsSchema = z.object({
  footer: z.object({
    tagline: nullableString,
    copyrightText: nullableString,
    links: z.array(footerLinkSchema).nullable(),
  }),
  seo: z.object({
    metaTitle: nullableString,
    metaDescription: nullableString,
    canonicalUrl: nullableString,
  }),
  legal: z.object({
    privacyPolicy: nullableString,
    terms: nullableString,
    cancellationPolicy: nullableString,
    refundPolicy: nullableString,
  }),
  faq: z.array(faqItemSchema).nullable(),
  stats: z.array(statItemSchema).nullable(),
  socialProof: z.array(socialProofItemSchema).nullable(),
  events: z.array(eventItemSchema).nullable(),
});

export const businessSettingsSchema = z.object({
  branding: brandingSettingsSchema,
  media: mediaSettingsSchema,
  contact: contactSettingsSchema,
  emails: emailSettingsSchema,
  booking: bookingSettingsSchema,
  pricing: pricingSettingsSchema,
  operations: operationsSettingsSchema,
  content: contentSettingsSchema,
  metadata: z.object({
    version: z.number().int().nonnegative(),
    updatedAt: nullableString,
    language: nullableString,
  }),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
