"use client";

import Link from "next/link";
import { useCallback } from "react";
import { CheckCircle2, ChevronRight, Download, Home } from "lucide-react";
import { motion } from "framer-motion";

import {
  BookingSummary,
  Button,
  Display,
  LAYOUT,
  PriceSummary,
  ScaleIn,
  StatusBadge,
  Text,
} from "@/components/design-system";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { formatCurrency } from "@/utils";
import { formatDate, formatPhoneNumber } from "@/utils/format";
import { cn } from "@/lib/utils";

type BookingConfirmationPageProps = {
  booking: BookingRecord;
  venueName: string;
};

export function BookingConfirmationPage({ booking, venueName }: BookingConfirmationPageProps) {
  const timeRange = `${booking.startTime} – ${booking.endTime}`;

  const handleDownloadReceipt = useCallback(() => {
    window.open(`/api/bookings/${booking.id}/receipt`, "_blank", "noopener,noreferrer");
  }, [booking.id]);

  return (
    <div className={cn(LAYOUT.containerMd, "py-10 sm:py-14")}>
      <ScaleIn className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-primary/15 text-primary mx-auto mb-6 flex size-20 items-center justify-center rounded-full"
        >
          <CheckCircle2 className="size-10" strokeWidth={1.5} />
        </motion.div>
        <Display size="md" className="text-foreground mb-2 tracking-wide">
          BOOKING CONFIRMED!
        </Display>
        <Text className="text-muted-foreground mb-4">
          Your turf slot is reserved. Show your booking reference at the venue.
        </Text>
        <div className="mb-8 flex justify-center">
          <StatusBadge status="confirmed" label="Confirmed" />
        </div>
        <p className="text-primary font-display text-2xl font-bold tracking-wider sm:text-3xl">
          {booking.bookingReference}
        </p>
      </ScaleIn>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <Text className="mb-4 font-semibold">Booking details</Text>
          <BookingSummary
            rows={[
              { label: "Venue", value: venueName },
              { label: "Date", value: formatDate(booking.bookingDate) },
              { label: "Time", value: timeRange },
              { label: "Duration", value: `${booking.durationMinutes} minutes` },
              { label: "Customer", value: booking.customerName },
              { label: "Phone", value: formatPhoneNumber(booking.customerPhone) },
              { label: "Email", value: booking.customerEmail },
            ]}
          />
          <div className="border-border/60 mt-5 border-t pt-4">
            <PriceSummary
              lines={[
                { label: "Total amount", amount: formatCurrency(booking.totalPrice) },
                {
                  label: "Advance paid",
                  amount: formatCurrency(booking.advancePaid),
                  emphasis: true,
                },
                {
                  label: "Remaining at venue",
                  amount: formatCurrency(booking.remainingAmount),
                },
              ]}
              total={{
                label: "Paid online",
                amount: formatCurrency(booking.advancePaid),
              }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button
            variant="booking"
            size="lg"
            className="touch-target min-h-12 w-full sm:w-auto"
            onClick={handleDownloadReceipt}
          >
            <Download className="size-4" />
            Download Booking Receipt
          </Button>
          <Link href="/book" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="touch-target min-h-12 w-full sm:min-w-[11rem]">
              Book Another Slot
              <ChevronRight className="size-4" />
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="ghost" size="lg" className="touch-target min-h-12 w-full sm:min-w-[10rem]">
              <Home className="size-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
