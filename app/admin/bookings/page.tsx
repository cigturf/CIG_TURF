import { AdminBookingsLiveView } from "@/features/admin/bookings/components/admin-bookings-live-view";
import { DEFAULT_ADMIN_BOOKINGS_QUERY } from "@/features/admin/bookings/lib/booking-filters";
import { listAdminBookings } from "@/features/admin/bookings/services/admin-booking.repository";
import { getBookingByReference } from "@/features/booking/services/booking.repository";

export const metadata = {
  title: "Bookings",
};

type AdminBookingsPageProps = {
  searchParams: Promise<{ id?: string; ref?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const initialData = await listAdminBookings(DEFAULT_ADMIN_BOOKINGS_QUERY);

  let initialSelectedId: string | null = params.id ?? null;
  if (!initialSelectedId && params.ref) {
    const booking = await getBookingByReference(params.ref);
    initialSelectedId = booking?.id ?? null;
  }

  return (
    <AdminBookingsLiveView initialData={initialData} initialSelectedId={initialSelectedId} />
  );
}
