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
