"use client";

import { FormField, FormInput, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

type BookingDetailsFormProps = {
  name: string;
  phone: string;
  email: string;
  nameError?: string;
  phoneError?: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  className?: string;
};

export function BookingDetailsForm({
  name,
  phone,
  email,
  nameError,
  phoneError,
  onNameChange,
  onPhoneChange,
  className,
}: BookingDetailsFormProps) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card rounded-[var(--radius-xl)] border p-5 shadow-[var(--shadow-sm)] sm:p-6",
        className,
      )}
    >
      <Text className="mb-1 font-semibold">Your details</Text>
      <Text size="sm" className="text-muted-foreground mb-5">
        We need your contact information to confirm your booking.
      </Text>

      <div className="space-y-4">
        <FormField label="Full name" htmlFor="booking-name" required error={nameError}>
          <FormInput
            id="booking-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            aria-invalid={Boolean(nameError)}
          />
        </FormField>

        <FormField label="Phone number" htmlFor="booking-phone" required error={phoneError}>
          <FormInput
            id="booking-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile"
            autoComplete="tel"
            aria-invalid={Boolean(phoneError)}
          />
        </FormField>

        <FormField label="Email address" htmlFor="booking-email">
          <FormInput
            id="booking-email"
            type="email"
            value={email}
            readOnly
            className="bg-muted/40"
            autoComplete="email"
          />
        </FormField>
      </div>
    </div>
  );
}
