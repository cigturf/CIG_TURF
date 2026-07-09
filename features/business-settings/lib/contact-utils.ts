import type { ContactSettings } from "@/features/business-settings/types";

/** Splits comma-separated contact tokens from admin settings into individual numbers. */
export function splitDelimitedContactValues(values: string[] | null | undefined): string[] {
  const tokens: string[] = [];

  for (const value of values ?? []) {
    for (const part of value.split(",")) {
      const trimmed = part.trim();
      if (trimmed) tokens.push(trimmed);
    }
  }

  return tokens;
}

/** Resolves configured phone numbers (excludes WhatsApp). */
export function resolveContactNumbers(contact: Pick<ContactSettings, "contactNumbers">): string[] {
  return splitDelimitedContactValues(contact.contactNumbers);
}

/** Resolves WhatsApp numbers, including legacy single `whatsappNumber` field. */
export function resolveWhatsappNumbers(
  contact: Pick<ContactSettings, "whatsappNumbers" | "whatsappNumber">,
): string[] {
  const fromArray = splitDelimitedContactValues(contact.whatsappNumbers);
  if (fromArray.length > 0) return fromArray;

  const legacy = contact.whatsappNumber?.trim();
  if (!legacy) return [];

  return splitDelimitedContactValues([legacy]);
}

export function toWhatsAppHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}
