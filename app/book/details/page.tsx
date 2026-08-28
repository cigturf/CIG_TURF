import { redirect } from "next/navigation";

import { BookingDetailsPageClient } from "@/components/booking/booking-details-page-client";
import { getSessionUserAction } from "@/features/auth/actions";
import { AUTH_ROUTES } from "@/features/auth/types";

export const metadata = {
  title: "Booking Details",
};

export default async function BookingDetailsRoute() {
  const user = await getSessionUserAction();

  if (!user) {
    redirect(`${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(AUTH_ROUTES.bookingDetails)}`);
  }

  return (
    <div className="surface-public min-h-screen">
      <BookingDetailsPageClient />
    </div>
  );
}
