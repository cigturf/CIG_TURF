"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button, Display, LAYOUT, Text } from "@/components/design-system";
import { readBookingSession, clearBookingSession } from "@/features/booking/utils";
import { cn } from "@/lib/utils";

type FinalizeState =
  | { status: "loading" }
  | { status: "slots_unavailable"; message: string }
  | { status: "manual_failure"; message: string }
  | { status: "error"; message: string };

export function SuccessProcessingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<FinalizeState>({ status: "loading" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sessionId =
      searchParams.get("sessionId") ?? readBookingSession()?.dbSessionId ?? null;

    if (!sessionId) {
      setState({
        status: "error",
        message: "Booking session not found. Please contact support if you were charged.",
      });
      return;
    }

    const finalize = async () => {
      try {
        const response = await fetch("/api/bookings/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingSessionId: sessionId }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.success && data.booking?.id) {
          clearBookingSession();
          router.replace(`/booking/confirmation/${data.booking.id}`);
          return;
        }

        if (data?.code === "slots_unavailable") {
          setState({
            status: "slots_unavailable",
            message:
              data.error ??
              "One or more slots became unavailable. Please choose different slots.",
          });
          return;
        }

        if (data?.code === "finalize_failed") {
          setState({
            status: "manual_failure",
            message:
              data.error ??
              "Your payment was successful, but we couldn't complete the booking automatically. Our team will contact you shortly.",
          });
          return;
        }

        setState({
          status: "error",
          message: data?.error ?? "Unable to finalize booking. Please try again.",
        });
      } catch {
        setState({
          status: "error",
          message: "Network error while finalizing your booking. Please refresh to retry.",
        });
      }
    };

    void finalize();
  }, [router, searchParams]);

  if (state.status === "loading") {
    return (
      <div
        className={cn(
          LAYOUT.containerMd,
          "flex min-h-[60vh] flex-col items-center justify-center py-16 text-center",
        )}
      >
        <Loader2 className="text-primary mb-6 size-12 animate-spin" aria-hidden />
        <Display size="sm" className="text-foreground mb-3">
          Confirming your booking
        </Display>
        <Text className="text-muted-foreground max-w-md">
          Payment received. We&apos;re reserving your slots and generating your booking
          reference.
        </Text>
      </div>
    );
  }

  const isSlotsIssue = state.status === "slots_unavailable";

  return (
    <div
      className={cn(
        LAYOUT.containerMd,
        "flex min-h-[60vh] flex-col items-center justify-center py-16 text-center",
      )}
    >
      <div
        className={cn(
          "mb-6 flex size-16 items-center justify-center rounded-full",
          isSlotsIssue ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600",
        )}
      >
        <AlertCircle className="size-8" strokeWidth={1.5} />
      </div>
      <Display size="sm" className="text-foreground mb-3">
        {isSlotsIssue ? "Slots no longer available" : "Booking needs assistance"}
      </Display>
      <Text className="text-muted-foreground max-w-md">{state.message}</Text>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        {isSlotsIssue ? (
          <Link href="/book" className="w-full sm:w-auto">
            <Button variant="booking" className="w-full sm:min-w-[10rem]">
              Choose new slots
            </Button>
          </Link>
        ) : (
          <Link href="/customer" className="w-full sm:w-auto">
            <Button variant="booking" className="w-full sm:min-w-[10rem]">
              My account
            </Button>
          </Link>
        )}
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:min-w-[10rem]">
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
