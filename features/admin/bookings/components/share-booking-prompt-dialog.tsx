"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/design-system";
import { useConfigContext } from "@/components/providers/config-provider";
import { ShareBookingWhatsAppButton } from "@/features/booking/components/share-booking-whatsapp-button";
import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";

type ShareBookingPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: AdminBookingRecord | null;
};

export function ShareBookingPromptDialog({
  open,
  onOpenChange,
  booking,
}: ShareBookingPromptDialogProps) {
  const { displayName: venueName, publicSettings, app } = useConfigContext();

  if (!booking) return null;

  const googleMapsLink = publicSettings.contact.googleMapsLink;
  const bookingUrl = `${app.url}/booking/summary/${booking.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Booking created</DialogTitle>
          <DialogDescription>
            {booking.bookingReference} is confirmed for {booking.customerName}. Share the details
            with them on WhatsApp?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not Now
          </Button>
          <ShareBookingWhatsAppButton
            venueName={venueName}
            bookingReference={booking.bookingReference}
            bookingDate={booking.bookingDate}
            startTime={booking.startTime}
            endTime={booking.endTime}
            googleMapsLink={googleMapsLink}
            bookingUrl={bookingUrl}
            customerName={booking.customerName}
            recipientPhone={booking.customerPhone}
            mode="admin-to-customer"
            variant="booking"
            label="Share on WhatsApp"
            onShared={() => onOpenChange(false)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
