import { BookingPageClient } from "@/components/booking/booking-page-client";
import { getMaintenanceState } from "@/features/business-settings/lib/maintenance-guard";
import { Display, LAYOUT, Text } from "@/components/design-system";

export const metadata = {
  title: "Book a Slot",
};

export default async function BookPage() {
  const maintenance = await getMaintenanceState();

  if (maintenance.active) {
    return (
      <div className={`${LAYOUT.containerMd} surface-public min-h-screen py-16 text-center`}>
        <Display size="sm">Booking temporarily unavailable</Display>
        <Text className="text-muted-foreground mx-auto mt-3 max-w-lg">
          {maintenance.message ??
            "We are performing scheduled maintenance. Please check back shortly."}
        </Text>
      </div>
    );
  }

  return (
    <div className="surface-public min-h-screen">
      <BookingPageClient />
    </div>
  );
}
