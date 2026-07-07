"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
import { ManualBookingDialog } from "@/features/admin/bookings/components/manual-booking-dialog";
import { formatBookingDateLabel } from "@/features/admin/bookings/lib/booking-utils";
import type { CustomerProfile } from "@/features/admin/customers/types/customer.types";
import {
  Badge,
  Button,
  DrawerPanel,
  DrawerRoot,
  FormTextarea,
  Separator,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type CustomerProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerKey: string | null;
  isOwner: boolean;
  onNotesSaved: () => Promise<void>;
  onBookingCreated: () => Promise<void>;
};

async function fetchCustomerProfile(customerKey: string): Promise<CustomerProfile | null> {
  const response = await fetch(
    `/api/admin/customers?customerKey=${encodeURIComponent(customerKey)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  return response.json() as Promise<CustomerProfile>;
}

function formatMethod(method: string) {
  return method === "online" ? "Razorpay" : method.replace(/_/g, " ");
}

export function CustomerProfileDrawer({
  open,
  onOpenChange,
  customerKey,
  isOwner,
  onNotesSaved,
  onBookingCreated,
}: CustomerProfileDrawerProps) {
  const router = useRouter();
  const publish = useAppEventPublisher();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    if (!open || !customerKey) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void fetchCustomerProfile(customerKey)
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setNotes(data?.ownerNotes ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, customerKey]);

  const copyToClipboard = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const saveNotes = async () => {
    if (!customerKey || !isOwner) return;
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(customerKey)}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Failed to save notes");
        return;
      }
      toast.success("Notes saved");
      publish(APP_EVENT_TYPES.CUSTOMER_NOTE_UPDATED, { customerKey });
      await onNotesSaved();
    } finally {
      setIsSavingNotes(false);
    }
  };

  const createManualBooking = async (payload: {
    bookingDate: string;
    selectedSlots: string[];
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    totalPrice: number;
    advancePaid: number;
    remainingAmount: number;
    notes?: string;
  }) => {
    const response = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Failed to create booking");
      return;
    }
    const booking = await response.json();
    toast.success(`Booking ${booking.bookingReference} created`);
    setManualOpen(false);
    await onBookingCreated();
    if (customerKey) {
      const refreshed = await fetchCustomerProfile(customerKey);
      setProfile(refreshed);
    }
  };

  return (
    <>
      <DrawerRoot open={open} onOpenChange={onOpenChange}>
        <DrawerPanel
          title={profile?.name ?? "Customer profile"}
          description={profile?.phone}
          className="max-w-md lg:max-w-xl"
        >
          {isLoading ? (
            <Text className="text-muted-foreground">Loading customer…</Text>
          ) : !profile ? (
            <Text className="text-muted-foreground">Customer not found.</Text>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span>{profile.email || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total bookings</span>
                  <span className="font-medium">{profile.totalBookings}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total spent</span>
                  <span className="font-medium">{formatCurrency(profile.totalAmountSpent)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className="font-medium">{formatCurrency(profile.outstandingAmount)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setManualOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Create Manual Booking
                </Button>
                {profile.latestBookingId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/bookings?booking=${profile.latestBookingId}`)}
                  >
                    <ExternalLink className="mr-2 size-4" />
                    View Latest Booking
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => void copyToClipboard("Phone", profile.phone)}>
                  <Copy className="mr-2 size-4" />
                  Copy Phone
                </Button>
                {profile.email ? (
                  <Button size="sm" variant="outline" onClick={() => void copyToClipboard("Email", profile.email)}>
                    <Copy className="mr-2 size-4" />
                    Copy Email
                  </Button>
                ) : null}
              </div>

              <Separator />

              <div>
                <Text className="mb-3 font-medium">Booking History</Text>
                <div className="space-y-2">
                  {profile.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-border/60 rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{booking.bookingReference}</span>
                        <Badge variant="outline">{booking.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {formatBookingDateLabel(booking.bookingDate)} · {booking.slotsLabel}
                      </p>
                      <p className="mt-1 font-medium">{formatCurrency(booking.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Text className="mb-3 font-medium">Payment History</Text>
                <div className="space-y-2">
                  {profile.payments.length === 0 ? (
                    <Text className="text-muted-foreground text-sm">No payments recorded.</Text>
                  ) : (
                    profile.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border-border/60 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium capitalize">{payment.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {payment.bookingReference} · {formatMethod(payment.method)} ·{" "}
                            {new Date(payment.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {isOwner ? (
                <div>
                  <Text className="mb-2 font-medium">Owner Notes</Text>
                  <Text className="text-muted-foreground mb-3 text-xs">
                    Private admin notes — e.g. Regular Customer, Tournament Captain, VIP
                  </Text>
                  <FormTextarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Add private notes about this customer…"
                  />
                  <Button className="mt-3" size="sm" onClick={() => void saveNotes()} disabled={isSavingNotes}>
                    {isSavingNotes ? "Saving…" : "Save Notes"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </DrawerPanel>
      </DrawerRoot>

      <ManualBookingDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        initialCustomerName={profile?.name}
        initialCustomerPhone={profile?.phone}
        initialCustomerEmail={profile?.email}
        onSubmit={createManualBooking}
      />
    </>
  );
}
