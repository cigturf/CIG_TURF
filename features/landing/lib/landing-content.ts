import type { BusinessSettingsPublic } from "@/features/business-settings/types";
import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";

import { resolveGoogleMapsEmbedUrl } from "@/features/landing/lib/google-maps-embed";

/** Generic placeholders — used only when Business Settings fields are empty */
export const LANDING_PLACEHOLDERS = {
  tagline: "Premium indoor cricket",
  heroHeadline: {
    line1: "The game",
    line2: "starts here",
  },
  heroDescription:
    "Professional turf. Stadium lights. Perfect conditions. Every match. Every session. Every time.",
  storyHeading: {
    line1: "Where friends",
    line2: "become teammates.",
  },
  storyBody:
    "Call your mates, pick a slot, and step under the floodlights together. Every evening here turns into banter in the pavilion, last-over drama, and stories you'll retell for years. Competitive when it counts — always fun when it matters.",
  facilityItems: [
    {
      id: "placeholder-1",
      title: "Premium Indoor Turf",
      description: "Professional-grade surface engineered for serious cricket.",
    },
    {
      id: "placeholder-2",
      title: "Stadium Floodlights",
      description: "Bright LED floodlights for day-or-night sessions.",
    },
    {
      id: "placeholder-3",
      title: "7500 Sq Ft Arena",
      description: "Spacious indoor ground built for matches and training.",
    },
    {
      id: "placeholder-4",
      title: "Match Ready Pitch",
      description: "Consistent bounce and pace for competitive play.",
    },
    {
      id: "placeholder-5",
      title: "Spacious Seating",
      description: "Comfortable viewing for players, coaches, and guests.",
    },
    {
      id: "placeholder-6",
      title: "Ample Parking",
      description: "Easy access with dedicated parking for visitors.",
    },
  ],
  stats: [
    {
      id: "stat-1",
      label: "Matches Played",
      value: null as number | null,
      suffix: "+",
      icon: "trophy",
    },
    {
      id: "stat-2",
      label: "Happy Players",
      value: null as number | null,
      suffix: "+",
      icon: "users",
    },
    {
      id: "stat-3",
      label: "Teams Hosted",
      value: null as number | null,
      suffix: "+",
      icon: "heart",
    },
  ],
  socialProof: [
    {
      id: "sp-1",
      icon: "star",
      title: "Loved by local cricket players",
      description: "Where weekend squads return again and again.",
    },
    {
      id: "sp-2",
      icon: "trophy",
      title: "Hundreds of matches hosted",
      description: "From friendly ties to full tournaments.",
    },
    {
      id: "sp-3",
      icon: "target",
      title: "Preferred by clubs and friends",
      description: "Corporate leagues, college teams, and mate groups.",
    },
    {
      id: "sp-4",
      icon: "flame",
      title: "Weekend slots fill fast",
      description: "Book early for prime evening sessions.",
    },
  ],
  bookingCta: {
    heading: "The next match",
    headingAccent: "is just one click away.",
    description:
      "Pick your date, choose a slot, and gather your squad. No login needed until you're ready to confirm.",
  },
  location: {
    mapPlaceholder: "Map will appear when location is configured",
  },
} as const;

export type LandingFacility = {
  id: string;
  title: string;
  description: string;
  configured: boolean;
};

export type LandingStat = {
  id: string;
  label: string;
  value: number | null;
  suffix?: string;
  icon: string;
  configured: boolean;
};

export type LandingSocialProof = {
  id: string;
  icon: string;
  title: string;
  description: string;
  configured: boolean;
};

export type LandingEvent = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationLink: string | null;
  ctaLabel: string;
  configured: boolean;
};

export type LandingFaq = {
  id: string;
  question: string;
  answer: string;
};

export type LandingGalleryItem = {
  id: string;
  url: string | null;
  alt: string;
  caption: string | null;
};

export type LandingPricingTier = {
  id: string;
  name: string;
  description: string | null;
  priceLabel: string | null;
};

export type LandingContent = {
  displayName: string;
  shortName: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  heroVideo: {
    url: string | null;
    posterUrl: string | null;
    autoplay: boolean;
    muted: boolean;
  } | null;
  heroImage: { url: string | null; alt: string } | null;
  facilities: LandingFacility[];
  gallery: LandingGalleryItem[];
  pricingTiers: LandingPricingTier[];
  stats: LandingStat[];
  socialProof: LandingSocialProof[];
  events: LandingEvent[];
  faq: LandingFaq[];
  contact: {
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    fullAddress: string | null;
    phones: string[];
    whatsapp: string | null;
    googleMapsLink: string | null;
    googleMapsEmbedUrl: string | null;
    email: string | null;
  };
  footer: {
    tagline: string | null;
    copyright: string | null;
    links: { label: string; url: string }[];
  };
  social: {
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    youtube: string | null;
    whatsapp: string | null;
    linkedin: string | null;
  };
};

function formatPrice(amount: number | null, currency: string | null): string | null {
  if (amount === null) return null;
  const code = currency ?? "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildFullAddress(contact: BusinessSettingsPublic["contact"]): string | null {
  const parts = [contact.address, contact.city, contact.state, contact.pincode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(", ") : null;
}

export function resolveLandingContent(
  settings: BusinessSettingsPublic,
  displayName: string,
  shortName: string,
): LandingContent {
  const { branding, media, contact, booking, pricing, content } = settings;

  const heroVideo = media.heroVideos?.[0] ?? null;
  const heroImage = media.heroImages?.[0] ?? null;

  const configuredFacilities: LandingFacility[] =
    booking.rules
      ?.filter((r) => r.title)
      .map((r) => ({
        id: r.id,
        title: r.title!,
        description: r.description ?? "",
        configured: true,
      })) ?? [];

  const facilities =
    configuredFacilities.length > 0
      ? configuredFacilities
      : LANDING_PLACEHOLDERS.facilityItems.map((f) => ({ ...f, configured: false }));

  const gallery: LandingGalleryItem[] =
    media.gallery
      ?.filter((g) => g.url)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((g) => ({
        id: g.id,
        url: normalizeAppMediaUrl(g.url) ?? g.url,
        alt: g.alt ?? branding.businessName ?? displayName,
        caption: g.caption,
      })) ?? [];

  const pricingTiers: LandingPricingTier[] =
    pricing.tiers
      ?.filter((t) => t.name)
      .map((t) => ({
        id: t.id,
        name: t.name!,
        description: t.description,
        priceLabel: formatPrice(t.pricePerHour, pricing.currency),
      })) ?? [];

  const configuredStats: LandingStat[] =
    content.stats
      ?.filter((s) => s.visible !== false && s.label)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((s) => ({
        id: s.id,
        label: s.label!,
        value: s.value,
        suffix: s.suffix ?? undefined,
        icon: s.icon ?? "trophy",
        configured: true,
      })) ?? [];

  const stats =
    configuredStats.length > 0
      ? configuredStats
      : LANDING_PLACEHOLDERS.stats.map((s) => ({ ...s, configured: false }));

  const configuredSocialProof: LandingSocialProof[] =
    content.socialProof
      ?.filter((item) => item.visible !== false && item.title)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item) => ({
        id: item.id,
        icon: item.icon ?? "star",
        title: item.title!,
        description: item.description ?? "",
        configured: true,
      })) ?? [];

  const socialProof =
    configuredSocialProof.length > 0
      ? configuredSocialProof
      : LANDING_PLACEHOLDERS.socialProof.map((item) => ({ ...item, configured: false }));

  const events: LandingEvent[] =
    content.events
      ?.filter((event) => event.visible !== false && event.title)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((event) => ({
        id: event.id,
        title: event.title!,
        subtitle: event.subtitle,
        description: event.description,
        bannerImageUrl: event.bannerImageUrl,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationLink: event.registrationLink,
        ctaLabel: event.ctaLabel ?? "Register",
        configured: true,
      })) ?? [];

  const faq: LandingFaq[] =
    content.faq
      ?.filter((f) => f.question && f.answer)
      .map((f) => ({
        id: f.id,
        question: f.question!,
        answer: f.answer!,
      })) ?? [];

  const footerLinks =
    content.footer.links
      ?.filter((l) => l.label && l.url)
      .map((l) => ({ label: l.label!, url: l.url! })) ?? [];

  const fullAddress = buildFullAddress(contact);

  return {
    displayName: branding.businessName ?? displayName,
    shortName: branding.shortName ?? shortName,
    tagline: branding.tagline ?? LANDING_PLACEHOLDERS.tagline,
    description: branding.description ?? LANDING_PLACEHOLDERS.heroDescription,
    logoUrl: branding.logoUrl,
    heroVideo: heroVideo
      ? {
          url: heroVideo.url,
          posterUrl: heroVideo.posterUrl,
          autoplay: heroVideo.autoplay ?? true,
          muted: heroVideo.muted ?? true,
        }
      : null,
    heroImage: heroImage ? { url: heroImage.url, alt: heroImage.alt ?? displayName } : null,
    facilities,
    gallery,
    pricingTiers,
    stats,
    socialProof,
    events,
    faq,
    contact: {
      address: contact.address,
      city: contact.city,
      state: contact.state,
      pincode: contact.pincode,
      fullAddress,
      phones: contact.contactNumbers ?? [],
      whatsapp: contact.whatsappNumber,
      googleMapsLink: contact.googleMapsLink,
      googleMapsEmbedUrl: resolveGoogleMapsEmbedUrl(contact.googleMapsLink, fullAddress),
      email: null,
    },
    footer: {
      tagline: content.footer.tagline ?? branding.tagline,
      copyright: content.footer.copyrightText,
      links: footerLinks,
    },
    social: contact.socialMediaLinks,
  };
}
