import { redirect } from "next/navigation";

import { CustomerDashboard } from "@/features/auth/components";
import { checkIsAdminAction, getSessionUserAction } from "@/features/auth/actions";
import { listBookingsByUserId } from "@/features/booking/services/booking.repository";
import { AUTH_ROUTES } from "@/features/auth/types";

export const metadata = {
  title: "My Account",
};

export default async function CustomerPage() {
  const user = await getSessionUserAction();

  if (!user) {
    redirect(`${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(AUTH_ROUTES.customer)}`);
  }

  if (await checkIsAdminAction(user.id)) {
    redirect(AUTH_ROUTES.admin);
  }

  if (!user.profileComplete) {
    redirect(`${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(AUTH_ROUTES.customer)}`);
  }

  const bookings = await listBookingsByUserId(user.id);

  return (
    <div className="surface-public min-h-screen">
      <CustomerDashboard
        initialName={user.name ?? undefined}
        initialEmail={user.email}
        initialPhone={user.phone}
        bookings={bookings}
      />
    </div>
  );
}
