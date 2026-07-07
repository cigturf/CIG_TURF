import { BookingDetailsPageClient } from "@/components/booking/booking-details-page-client";

export const metadata = {
  title: "Booking Details",
};

export default function BookingDetailsRoute() {
  return (
    <div className="surface-public min-h-screen">
      <BookingDetailsPageClient />
    </div>
  );
}
