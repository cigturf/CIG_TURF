"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { submitBookingProfile } from "@/features/auth/lib/auth-client-api";
import { BookingDetailsForm } from "@/features/booking/components/booking-details-form";
import { BookingDetailsSummary } from "@/features/booking/components/booking-details-summary";
import { bookingDetailsProfileSchema } from "@/features/booking/schemas/booking-details.schema";
import {
  readBookingSession,
  updateBookingSessionDbId,
  updateBookingSessionProfile,
} from "@/features/booking/utils";
import { useAuthSession } from "@/features/auth/hooks";
import { AUTH_ROUTES } from "@/features/auth/types";
import { buildLoginUrl } from "@/features/auth/utils/redirect";
import {
  PAYMENT_ADVANCE_AMOUNT_INR,
  useRazorpayCheckout,
  type CreateOrderResponse,
} from "@/features/payments";
import { Button, Display, LAYOUT, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type BookingDetailsPageProps = {
  venueName: string;
};

export function BookingDetailsPage({ venueName }: BookingDetailsPageProps) {
  const router = useRouter();
  const { openCheckout } = useRazorpayCheckout();
  const { user, isAuthenticated, isPending } = useAuthSession();
  const [session, setSession] = useState(readBookingSession());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [phoneError, setPhoneError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const paymentInFlight = useRef(false);

  useEffect(() => {
    setSession(readBookingSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isPending) return;

    if (!isAuthenticated) {
      router.replace(buildLoginUrl(AUTH_ROUTES.bookingDetails));
      return;
    }

    if (!session) {
      router.replace("/book");
    }
  }, [hydrated, isAuthenticated, isPending, router, session]);

  useEffect(() => {
    if (!user) return;

    setEmail(user.email);
    setName(user.name ?? session?.profile?.name ?? "");
    setPhone(user.phone ?? session?.profile?.phone ?? "");
  }, [user, session?.profile?.name, session?.profile?.phone]);

  const validateForm = useCallback(() => {
    const result = bookingDetailsProfileSchema.safeParse({ name, phone });
    setNameError(undefined);
    setPhoneError(undefined);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === "name") setNameError(issue.message);
        if (field === "phone") setPhoneError(issue.message);
      }
      return false;
    }

    return true;
  }, [name, phone]);

  const verifyPayment = async (
    bookingSessionId: string,
    payment: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) => {
    const verifyResponse = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingSessionId,
        ...payment,
      }),
    });

    const verifyData = await verifyResponse.json().catch(() => null);

    if (!verifyResponse.ok) {
      throw new Error(verifyData?.error ?? "Payment verification failed");
    }

    return verifyData;
  };

  const handlePayAndConfirm = async () => {
    if (!session || paymentInFlight.current) return;

    if (!validateForm()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    paymentInFlight.current = true;
    setLoading(true);

    try {
      const profileResult = await submitBookingProfile({ name: name.trim(), phone });

      if (!profileResult.success) {
        paymentInFlight.current = false;
        setLoading(false);
        if (profileResult.error?.toLowerCase().includes("session expired")) {
          toast.error("Session expired", {
            description: "Please sign in again to continue your booking.",
          });
          router.replace(buildLoginUrl(AUTH_ROUTES.bookingDetails));
          return;
        }

        toast.error(profileResult.error ?? "Failed to save profile", {
          description: "Check your connection and try again.",
        });
        return;
      }

      const profileEmail = profileResult.email ?? email;
      updateBookingSessionProfile({
        name: name.trim(),
        phone,
        email: profileEmail,
      });

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSessionId: session.dbSessionId,
          dateIso: session.dateIso,
          selectedSlotIds: session.selectedSlotIds,
          timeRange: session.timeRange,
          slotCount: session.slotCount,
          totalDurationMinutes: session.totalDurationMinutes,
          totalDurationLabel: session.totalDurationLabel,
          totalPrice: session.totalPrice,
          advanceAmount: session.advanceAmount,
          remainingAmount: session.remainingAmount,
          profile: {
            name: name.trim(),
            phone,
            email: profileEmail,
          },
        }),
      });

      const orderData = (await orderResponse.json().catch(() => null)) as
        | (CreateOrderResponse & { error?: string })
        | null;

      if (!orderResponse.ok || !orderData?.orderId) {
        paymentInFlight.current = false;
        setLoading(false);
        if (orderResponse.status === 409) {
          toast.error("Payment already completed", {
            description: "This booking session has already been paid for.",
          });
          return;
        }

        if (orderResponse.status === 410) {
          toast.error("Session expired", {
            description: "Your booking session expired. Please select slots again.",
          });
          router.replace("/book");
          return;
        }

        toast.error(orderData?.error ?? "Unable to start payment", {
          description: "Check your connection and try again.",
        });
        return;
      }

      updateBookingSessionDbId(orderData.bookingSessionId);
      setSession(readBookingSession());

      await openCheckout({
        order: orderData,
        customer: {
          name: name.trim(),
          email: profileEmail,
          phone,
        },
        onDismiss: () => {
          paymentInFlight.current = false;
          setLoading(false);
          toast.message("Payment cancelled", {
            description: "Your booking details are saved. You can retry payment anytime.",
          });
        },
        onFailure: (message) => {
          paymentInFlight.current = false;
          setLoading(false);
          toast.error("Payment failed", { description: message });
        },
        onSuccess: async (payment) => {
          try {
            await verifyPayment(orderData.bookingSessionId, payment);
            router.push(
              `/booking/success-processing?sessionId=${encodeURIComponent(orderData.bookingSessionId)}`,
            );
          } catch (error) {
            paymentInFlight.current = false;
            setLoading(false);
            toast.error("Verification failed", {
              description:
                error instanceof Error
                  ? error.message
                  : "Payment received but could not be verified. Contact support if charged.",
            });
          }
        },
      });
    } catch {
      paymentInFlight.current = false;
      setLoading(false);
      toast.error("Something went wrong", {
        description: "Check your network connection and try again.",
      });
    }
  };

  const payLabel = `Pay ${formatCurrency(PAYMENT_ADVANCE_AMOUNT_INR)} & Confirm`;

  if (!hydrated || isPending || !session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={cn(LAYOUT.containerXl, "pb-32 pt-6 sm:pt-8 lg:pb-12")}>
      <Link
        href="/book"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to slots
      </Link>

      <Display size="sm" className="text-foreground mb-2">
        Booking details
      </Display>
      <Text className="text-muted-foreground mb-8 max-w-2xl">
        Confirm your contact details and pay the advance to secure your slots.
      </Text>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="order-2 space-y-6 lg:order-1">
          <BookingDetailsForm
            name={name}
            phone={phone}
            email={email}
            nameError={nameError}
            phoneError={phoneError}
            onNameChange={(value) => {
              setName(value);
              if (nameError) setNameError(undefined);
            }}
            onPhoneChange={(value) => {
              setPhone(value);
              if (phoneError) setPhoneError(undefined);
            }}
          />

          <div className="mobile-hidden">
            <Button
              variant="booking"
              size="lg"
              className="touch-target min-h-12 w-full sm:w-auto sm:min-w-[12rem]"
              disabled={loading}
              onClick={handlePayAndConfirm}
            >
              {loading ? "Processing…" : payLabel}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <BookingDetailsSummary venueName={venueName} session={session} />
          </div>
        </div>
      </div>

      <div className="mobile-only">
        <div className="border-border/80 bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <Text size="sm" className="truncate font-semibold">
                {session.timeRange ?? "Selected slots"}
              </Text>
              <Text size="sm" className="text-muted-foreground truncate">
                Advance {formatCurrency(session.advanceAmount)}
              </Text>
            </div>
          </div>
          <Button
            variant="booking"
            size="lg"
            className="touch-target min-h-12 w-full"
            disabled={loading}
            onClick={handlePayAndConfirm}
          >
            {loading ? "Processing…" : payLabel}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
