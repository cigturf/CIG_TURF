import { redirect } from "next/navigation";

import { BookingConfirmationPage } from "@/features/booking/components/booking-confirmation-page";
import { getBookingById } from "@/features/booking/services/booking.repository";
import { getSessionUserAction } from "@/features/auth/actions";
import { AUTH_ROUTES } from "@/features/auth/types";
import { getAppConfig } from "@/config/app.config";

export const metadata = {
  title: "Booking Confirmed",
};

type ConfirmationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const user = await getSessionUserAction();

  if (!user) {
    redirect(`${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(`/booking/confirmation/${id}`)}`);
  }

  const booking = await getBookingById(id);

  // Manual bookings are created under the admin's user_id (there's no
  // customer session to attribute them to), so ownership also has to allow
  // an email match — otherwise a customer can never open a booking an admin
  // entered under their email, even though it now shows in their list.
  const ownsBooking =
    booking &&
    (booking.userId === user.id ||
      booking.customerEmail.toLowerCase() === user.email.toLowerCase());

  if (!ownsBooking) {
    redirect(AUTH_ROUTES.customer);
  }

  const venueName = getAppConfig().envDisplayName;

  return (
    <div className="surface-public min-h-screen">
      <BookingConfirmationPage booking={booking} venueName={venueName} />
    </div>
  );
}
