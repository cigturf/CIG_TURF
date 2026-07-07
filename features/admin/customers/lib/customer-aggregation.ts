import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type {
  CustomerBookingHistoryItem,
  CustomerFilter,
  CustomerListItem,
  CustomerPaymentHistoryItem,
  CustomerProfile,
  CustomerStatus,
} from "@/features/admin/customers/types/customer.types";

export function normalizeCustomerKey(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits || phone.trim().toLowerCase();
}

function paymentNetAmount(payment: BookingPaymentRecord): number {
  return payment.type === "refund" ? -payment.amount : payment.amount;
}

function resolveCustomerStatus(
  totalBookings: number,
  outstandingAmount: number,
): CustomerStatus {
  if (outstandingAmount > 0) return "pending";
  if (totalBookings > 1) return "repeat";
  if (totalBookings === 1) return "new";
  return "active";
}

export function buildCustomerDirectory(
  bookings: AdminBookingRecord[],
  payments: BookingPaymentRecord[],
): CustomerListItem[] {
  const paymentsByBooking = new Map<string, BookingPaymentRecord[]>();
  for (const payment of payments) {
    const list = paymentsByBooking.get(payment.bookingId) ?? [];
    list.push(payment);
    paymentsByBooking.set(payment.bookingId, list);
  }

  const grouped = new Map<string, AdminBookingRecord[]>();

  for (const booking of bookings) {
    const key = normalizeCustomerKey(booking.customerPhone);
    const list = grouped.get(key) ?? [];
    list.push(booking);
    grouped.set(key, list);
  }

  const customers: CustomerListItem[] = [];

  for (const [customerKey, customerBookings] of grouped.entries()) {
    const sorted = [...customerBookings].sort((a, b) => {
      const dateCompare = b.bookingDate.localeCompare(a.bookingDate);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const latest = sorted[0]!;
    const activeBookings = customerBookings.filter((booking) => booking.status !== "cancelled");
    const totalAmountSpent = customerBookings.reduce((sum, booking) => {
      const bookingPayments = paymentsByBooking.get(booking.id) ?? [];
      return (
        sum +
        bookingPayments.reduce((paymentSum, payment) => paymentSum + paymentNetAmount(payment), 0)
      );
    }, 0);
    const outstandingAmount = activeBookings.reduce(
      (sum, booking) => sum + booking.remainingAmount,
      0,
    );

    customers.push({
      customerKey,
      name: latest.customerName,
      phone: latest.customerPhone,
      email: latest.customerEmail,
      totalBookings: customerBookings.length,
      lastBookingDate: latest.bookingDate,
      totalAmountSpent,
      outstandingAmount,
      status: resolveCustomerStatus(customerBookings.length, outstandingAmount),
      latestBookingId: latest.id,
    });
  }

  return customers.sort((a, b) => {
    const dateCompare = (b.lastBookingDate ?? "").localeCompare(a.lastBookingDate ?? "");
    if (dateCompare !== 0) return dateCompare;
    return a.name.localeCompare(b.name);
  });
}

export function filterCustomers(
  customers: CustomerListItem[],
  search?: string,
  filter: CustomerFilter = "all",
): CustomerListItem[] {
  let filtered = [...customers];

  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.email.toLowerCase().includes(term),
    );
  }

  switch (filter) {
    case "repeat":
      filtered = filtered.filter((customer) => customer.totalBookings > 1);
      break;
    case "new":
      filtered = filtered.filter((customer) => customer.totalBookings === 1);
      break;
    case "pending":
      filtered = filtered.filter((customer) => customer.outstandingAmount > 0);
      break;
    case "most_active":
      filtered = filtered.sort((a, b) => b.totalBookings - a.totalBookings);
      break;
    default:
      break;
  }

  return filtered;
}

export function searchCustomersByBookingReference(
  customers: CustomerListItem[],
  bookings: AdminBookingRecord[],
  term: string,
): CustomerListItem[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return customers;

  const keys = new Set(
    bookings
      .filter((booking) => booking.bookingReference.toLowerCase().includes(normalized))
      .map((booking) => normalizeCustomerKey(booking.customerPhone)),
  );

  if (keys.size === 0) return [];

  return customers.filter((customer) => keys.has(customer.customerKey));
}

export function buildCustomerProfile(
  customerKey: string,
  bookings: AdminBookingRecord[],
  payments: BookingPaymentRecord[],
  ownerNotes: string | null,
): CustomerProfile | null {
  const customerBookings = bookings.filter(
    (booking) => normalizeCustomerKey(booking.customerPhone) === customerKey,
  );

  if (customerBookings.length === 0) return null;

  const [listItem] = buildCustomerDirectory(customerBookings, payments);

  if (!listItem) return null;

  const bookingHistory: CustomerBookingHistoryItem[] = [...customerBookings]
    .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))
    .map((booking) => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      slotsLabel: `${booking.startTime} – ${booking.endTime}`,
      amount: booking.totalPrice,
      status: booking.status,
    }));

  const bookingRefs = new Map(customerBookings.map((booking) => [booking.id, booking.bookingReference]));

  const paymentHistory: CustomerPaymentHistoryItem[] = payments
    .filter((payment) => bookingRefs.has(payment.bookingId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((payment) => ({
      id: payment.id,
      bookingReference: bookingRefs.get(payment.bookingId) ?? "—",
      type: payment.type,
      amount: payment.amount,
      method: payment.method,
      createdAt: payment.createdAt.toISOString(),
      label:
        payment.type === "advance"
          ? "Advance"
          : payment.type === "remaining"
            ? "Offline Payment"
            : payment.type,
    }));

  return {
    ...listItem,
    bookings: bookingHistory,
    payments: paymentHistory,
    ownerNotes,
  };
}

export function formatCustomerStatus(status: CustomerStatus): string {
  switch (status) {
    case "pending":
      return "Pending Payment";
    case "repeat":
      return "Repeat";
    case "new":
      return "New";
    default:
      return "Active";
  }
}
