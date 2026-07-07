import {
  listAllBookings,
  listAllPaymentRecords,
  listBookingsByCustomerKey,
  listPaymentRecordsForBookingIds,
} from "@/features/admin/finance/services/finance-data.repository";
import {
  buildCustomerDirectory,
  buildCustomerProfile,
  filterCustomers,
  searchCustomersByBookingReference,
} from "@/features/admin/customers/lib/customer-aggregation";
import {
  getCustomerNote,
  upsertCustomerNote,
} from "@/features/admin/customers/services/customer-notes.repository";
import type {
  CustomerDirectoryData,
  CustomerDirectoryQuery,
  CustomerProfile,
} from "@/features/admin/customers/types/customer.types";

export async function getCustomerDirectoryData(
  query: CustomerDirectoryQuery = {},
): Promise<CustomerDirectoryData> {
  const [bookings, payments] = await Promise.all([listAllBookings(), listAllPaymentRecords()]);
  let customers = buildCustomerDirectory(bookings, payments);

  if (query.search?.trim()) {
    const term = query.search.trim();
    const direct = filterCustomers(customers, term, "all");
    const byReference = searchCustomersByBookingReference(customers, bookings, term);
    const merged = new Map<string, (typeof customers)[number]>();
    for (const customer of [...direct, ...byReference]) {
      merged.set(customer.customerKey, customer);
    }
    customers = [...merged.values()];
  }

  customers = filterCustomers(customers, undefined, query.filter ?? "all");

  return {
    customers,
    total: customers.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function getCustomerProfile(customerKey: string): Promise<CustomerProfile | null> {
  const [bookings, ownerNotes] = await Promise.all([
    listBookingsByCustomerKey(customerKey),
    getCustomerNote(customerKey),
  ]);

  if (bookings.length === 0) return null;

  const payments = await listPaymentRecordsForBookingIds(bookings.map((booking) => booking.id));

  return buildCustomerProfile(customerKey, bookings, payments, ownerNotes);
}

export async function updateCustomerNotes(
  customerKey: string,
  notes: string | null,
  updatedBy: string,
): Promise<string | null> {
  return upsertCustomerNote(customerKey, notes?.trim() || null, updatedBy);
}
