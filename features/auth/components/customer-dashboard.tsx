"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Calendar, ChevronRight, LogOut, User } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";
import { useAuthSession } from "@/features/auth/hooks";
import { AUTH_ROUTES } from "@/features/auth/types";
import { buildLoginUrl } from "@/features/auth/utils/redirect";
import { ShareBookingWhatsAppButton } from "@/features/booking/components/share-booking-whatsapp-button";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import {
  Button,
  Display,
  EmptyState,
  LAYOUT,
  Skeleton,
  SkeletonText,
  Stagger,
  StaggerItem,
  StatusBadge,
  Text,
} from "@/components/design-system";
import { useConfigContext } from "@/components/providers/config-provider";
import { formatCurrency } from "@/utils";
import { formatDate, formatPhoneNumber } from "@/utils/format";

type CustomerDashboardProps = {
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string | null;
  bookings?: BookingRecord[];
};

export function CustomerDashboard({
  initialName,
  initialEmail,
  initialPhone,
  bookings = [],
}: CustomerDashboardProps) {
  const router = useRouter();
  const { user, isPending, isAuthenticated } = useAuthSession();
  const { displayName: businessName, publicSettings, app } = useConfigContext();
  const googleMapsLink = publicSettings.contact.googleMapsLink;

  const displayName = user?.name || initialName || "Player";
  const displayEmail = user?.email || initialEmail || "";
  const displayPhone = user?.phone || initialPhone;
  const upcomingBookings = bookings.filter((booking) => booking.status === "confirmed");

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.replace(buildLoginUrl(AUTH_ROUTES.customer));
    }
  }, [isPending, isAuthenticated, router]);

  if (isPending || !isAuthenticated) {
    return (
      <div className={LAYOUT.containerMd}>
        <div className="py-10 sm:py-14">
          <Skeleton className="mb-2 h-8 w-56" />
          <Skeleton className="mb-8 h-4 w-72" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6 sm:col-span-2">
              <Skeleton className="mb-4 h-10 w-40 rounded-full" />
              <SkeletonText lines={3} />
            </div>
            <div className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6">
              <Skeleton className="mb-4 h-10 w-32 rounded-full" />
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOutAction();
    window.location.href = "/";
  };

  return (
    <div className={LAYOUT.containerMd}>
      <div className="py-10 sm:py-14">
        <Display size="sm" className="text-foreground mb-2">
          Welcome, {displayName.split(" ")[0]}
        </Display>
        <Text className="text-muted-foreground mb-8">
          Your {businessName} profile and bookings.
        </Text>

        <Stagger className="grid gap-4 sm:grid-cols-2">
          <StaggerItem className="sm:col-span-2">
            <section className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-full">
                  <Calendar className="size-5" />
                </div>
                <Text className="font-semibold">Your bookings</Text>
              </div>

              {upcomingBookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No bookings yet"
                  description="Book your first slot to get started."
                >
                  <Link href="/book" className="mt-1 inline-block">
                    <Button variant="booking" size="sm" className="touch-target min-h-11">
                      Book a slot
                    </Button>
                  </Link>
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-border/60 hover:border-primary/30 hover:bg-muted/30 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors"
                    >
                      <Link href={`/booking/confirmation/${booking.id}`} className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Text className="font-semibold">{booking.bookingReference}</Text>
                          <StatusBadge status="confirmed" label="Confirmed" />
                        </div>
                        <Text size="sm" className="text-muted-foreground">
                          {formatDate(booking.bookingDate)} · {booking.startTime} –{" "}
                          {booking.endTime}
                        </Text>
                        <Text size="sm" className="text-muted-foreground">
                          Advance paid {formatCurrency(booking.advancePaid)}
                        </Text>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <ShareBookingWhatsAppButton
                          venueName={businessName}
                          bookingReference={booking.bookingReference}
                          bookingDate={booking.bookingDate}
                          startTime={booking.startTime}
                          endTime={booking.endTime}
                          googleMapsLink={googleMapsLink}
                          bookingUrl={`${app.url}/booking/summary/${booking.id}`}
                          iconOnly
                          variant="ghost"
                          label="Share with Friends"
                        />
                        <Link
                          href={`/booking/confirmation/${booking.id}`}
                          aria-label="View booking"
                        >
                          <ChevronRight className="text-muted-foreground size-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-full">
                  <User className="size-5" />
                </div>
                <Text className="font-semibold">Profile</Text>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{displayEmail}</dd>
                </div>
                {displayPhone ? (
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{formatPhoneNumber(displayPhone)}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </StaggerItem>
        </Stagger>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" className="touch-target min-h-11" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
          <Link href="/">
            <Button variant="ghost" className="touch-target min-h-11">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
