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

  if (!booking || booking.userId !== user.id) {
    redirect(AUTH_ROUTES.customer);
  }

  const venueName = getAppConfig().envDisplayName;

  return (
    <div className="surface-public min-h-screen">
      <BookingConfirmationPage booking={booking} venueName={venueName} />
    </div>
  );
}
