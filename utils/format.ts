const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatDate(date: Date | string | number) {
  return dateFormatter.format(new Date(date));
}

export function formatTime(date: Date | string | number) {
  return timeFormatter.format(new Date(date));
}

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return phone;
}

/**
 * WhatsApp click-to-chat links (wa.me / api.whatsapp.com) need the full
 * international number — a bare 10-digit number fails with "this link
 * couldn't be opened". Numbers are entered/stored without a country code
 * throughout this app, so a 10-digit number is assumed Indian; any other
 * length is passed through as-is (already has a country code).
 */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}
