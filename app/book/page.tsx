import { BookingPageClient } from "@/components/booking/booking-page-client";

export const metadata = {
  title: "Book a Slot",
};

export default function BookPage() {
  return (
    <div className="surface-public min-h-screen">
      <BookingPageClient />
    </div>
  );
}
