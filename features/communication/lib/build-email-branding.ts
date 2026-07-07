import type {
  CommunicationSettings,
  EmailBrandingContext,
} from "@/features/communication/types/email.types";
import { resolveEmailLogoUrl } from "@/features/communication/lib/resolve-email-logo-url";
import { resolveThemeAccentColor } from "@/features/business-settings/lib/parse";
import type { BusinessSettings } from "@/features/business-settings/types";
import { SettingsService } from "@/server/settings/settings.service";

function buildFullAddress(contact: BusinessSettings["contact"]): string | null {
  const parts = [contact.address, contact.city, contact.state, contact.pincode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function resolveCommunicationSettings(settings: BusinessSettings): CommunicationSettings {
  const { emails } = settings;
  const ownerEmails = [
    ...(emails.ownerNotificationEmails ?? []),
    ...(emails.bookingNotificationEmails ?? []),
  ].filter(Boolean);

  return {
    fromName: emails.fromName ?? settings.branding.businessName,
    replyToEmail: emails.replyToEmail ?? emails.supportEmails?.[0] ?? null,
    ownerNotificationEmails: [...new Set(ownerEmails)],
    supportEmails: emails.supportEmails ?? [],
    enableCustomerEmails: emails.enableCustomerEmails ?? true,
    enableOwnerEmails: emails.enableOwnerEmails ?? true,
  };
}

export function buildEmailBrandingFromSettings(settings: BusinessSettings): EmailBrandingContext {
  const communication = resolveCommunicationSettings(settings);
  const social = settings.contact.socialMediaLinks;

  return {
    businessName: settings.branding.businessName ?? "Turf Booking",
    logoUrl: settings.branding.logoUrl,
    phone: settings.contact.contactNumbers?.[0] ?? settings.contact.whatsappNumber,
    supportEmail: communication.supportEmails[0] ?? communication.replyToEmail,
    address: buildFullAddress(settings.contact),
    googleMapsLink: settings.contact.googleMapsLink,
    websiteUrl: settings.contact.websiteUrl,
    socialInstagram: social.instagram,
    socialFacebook: social.facebook,
    fromName: communication.fromName ?? settings.branding.businessName ?? "Turf Booking",
    replyTo: communication.replyToEmail,
    accentColor: resolveThemeAccentColor(settings) ?? "#16a34a",
  };
}

export async function loadEmailBrandingContext(): Promise<{
  branding: EmailBrandingContext;
  communication: CommunicationSettings;
}> {
  const settings = await SettingsService.getOrEmpty();
  const branding = buildEmailBrandingFromSettings(settings);
  branding.logoUrl = await resolveEmailLogoUrl(branding.logoUrl);

  return {
    branding,
    communication: resolveCommunicationSettings(settings),
  };
}
