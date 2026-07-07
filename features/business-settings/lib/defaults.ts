import type {
  BookingSettings,
  BrandingSettings,
  BusinessSettings,
  ContactSettings,
  ContentSettings,
  EmailSettings,
  MediaSettings,
  OperationsSettings,
  PricingSettings,
  SocialMediaLinks,
} from "@/features/business-settings/types";

/**
 * Creates an empty BusinessSettings object with all nullable fields.
 * Used when no database record exists — never contains hardcoded business values.
 */
export function createEmptyBusinessSettings(): BusinessSettings {
  return {
    branding: createEmptyBrandingSettings(),
    media: createEmptyMediaSettings(),
    contact: createEmptyContactSettings(),
    emails: createEmptyEmailSettings(),
    booking: createEmptyBookingSettings(),
    pricing: createEmptyPricingSettings(),
    operations: createEmptyOperationsSettings(),
    content: createEmptyContentSettings(),
    metadata: {
      version: 0,
      updatedAt: null,
      language: null,
    },
  };
}

export function createEmptyBrandingSettings(): BrandingSettings {
  return {
    businessName: null,
    shortName: null,
    tagline: null,
    description: null,
    logoUrl: null,
    faviconUrl: null,
    themeAccentColor: null,
  };
}

export function createEmptyMediaSettings(): MediaSettings {
  return {
    heroVideos: null,
    heroImages: null,
    gallery: null,
  };
}

export function createEmptySocialMediaLinks(): SocialMediaLinks {
  return {
    instagram: null,
    facebook: null,
    twitter: null,
    youtube: null,
    whatsapp: null,
    linkedin: null,
  };
}

export function createEmptyContactSettings(): ContactSettings {
  return {
    address: null,
    city: null,
    state: null,
    pincode: null,
    contactNumbers: null,
    whatsappNumber: null,
    googleMapsLink: null,
    websiteUrl: null,
    socialMediaLinks: createEmptySocialMediaLinks(),
  };
}

export function createEmptyEmailSettings(): EmailSettings {
  return {
    fromName: null,
    replyToEmail: null,
    ownerNotificationEmails: null,
    bookingNotificationEmails: null,
    financeEmails: null,
    supportEmails: null,
    enableCustomerEmails: true,
    enableOwnerEmails: true,
  };
}

export function createEmptyBookingSettings(): BookingSettings {
  return {
    rules: null,
    slotDurationMinutes: null,
    maxAdvanceBookingDays: null,
    minAdvanceBookingHours: null,
    cancellationWindowHours: null,
    maxPlayersPerSlot: null,
    allowGuestBooking: null,
    requireDeposit: null,
    advanceAmount: null,
  };
}

export function createEmptyPricingSettings(): PricingSettings {
  return {
    currency: null,
    taxRatePercent: null,
    depositPercent: null,
    peakHourMultiplier: null,
    tiers: null,
  };
}

export function createEmptyOperationsSettings(): OperationsSettings {
  return {
    timezone: null,
    businessHours: null,
    maintenanceMode: null,
    maintenanceMessage: null,
  };
}

export function createEmptyContentSettings(): ContentSettings {
  return {
    footer: {
      tagline: null,
      copyrightText: null,
      links: null,
    },
    seo: {
      metaTitle: null,
      metaDescription: null,
      canonicalUrl: null,
    },
    legal: {
      privacyPolicy: null,
      terms: null,
      cancellationPolicy: null,
      refundPolicy: null,
    },
    faq: null,
    stats: null,
    socialProof: null,
    events: null,
  };
}
