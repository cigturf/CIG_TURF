"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Calendar, ChevronRight, LogOut, User } from "lucide-react";

import { signOutClient, useAuthSession } from "@/features/auth/hooks";
import { AUTH_ROUTES } from "@/features/auth/types";
import { buildLoginUrl } from "@/features/auth/utils/redirect";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { Button, Display, LAYOUT, StatusBadge, Text } from "@/components/design-system";
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
  const { displayName: businessName } = useConfigContext();

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOutClient();
    router.push("/");
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

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6 sm:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-full">
                <Calendar className="size-5" />
              </div>
              <Text className="font-semibold">Your bookings</Text>
            </div>

            {upcomingBookings.length === 0 ? (
              <>
                <Text size="sm" className="text-muted-foreground">
                  No confirmed bookings yet. Book your first slot to get started.
                </Text>
                <Link href="/book" className="mt-4 inline-block">
                  <Button variant="booking" size="sm" className="touch-target min-h-11">
                    Book a slot
                  </Button>
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/booking/confirmation/${booking.id}`}
                    className="border-border/60 hover:border-primary/30 hover:bg-muted/30 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Text className="font-semibold">{booking.bookingReference}</Text>
                        <StatusBadge status="confirmed" label="Confirmed" />
                      </div>
                      <Text size="sm" className="text-muted-foreground">
                        {formatDate(booking.bookingDate)} · {booking.startTime} – {booking.endTime}
                      </Text>
                      <Text size="sm" className="text-muted-foreground">
                        Advance paid {formatCurrency(booking.advancePaid)}
                      </Text>
                    </div>
                    <ChevronRight className="text-muted-foreground size-5 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </section>

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
        </div>

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
