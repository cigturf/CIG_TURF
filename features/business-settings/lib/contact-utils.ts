import type { ContactSettings } from "@/features/business-settings/types";

/** Resolves configured phone numbers (excludes WhatsApp). */
export function resolveContactNumbers(contact: Pick<ContactSettings, "contactNumbers">): string[] {
  return (contact.contactNumbers ?? []).map((value) => value.trim()).filter(Boolean);
}

/** Resolves WhatsApp numbers, including legacy single `whatsappNumber` field. */
export function resolveWhatsappNumbers(
  contact: Pick<ContactSettings, "whatsappNumbers" | "whatsappNumber">,
): string[] {
  const fromArray = (contact.whatsappNumbers ?? []).map((value) => value.trim()).filter(Boolean);
  if (fromArray.length > 0) return fromArray;

  const legacy = contact.whatsappNumber?.trim();
  return legacy ? [legacy] : [];
}
