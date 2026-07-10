"use client";

import { useState } from "react";
import { toast } from "sonner";

import { sendEmailOtp, verifyEmailOtp } from "@/features/auth/lib/email-otp.client";
import { Button, FormField, FormInput, Text } from "@/components/design-system";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validations/common";

type EmailOtpVerificationProps = {
  email: string;
  otpAlreadySent?: boolean;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onVerified: (userId: string, email: string) => void;
  onBack: () => void;
};

export function EmailOtpVerification({
  email,
  otpAlreadySent = false,
  loading: externalLoading = false,
  onLoadingChange,
  onVerified,
  onBack,
}: EmailOtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(otpAlreadySent);
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = externalLoading || internalLoading;

  const setLoading = (value: boolean) => {
    setInternalLoading(value);
    onLoadingChange?.(value);
  };

  const normalizedEmail = email.trim().toLowerCase();

  const handleSendOtp = async () => {
    const parsed = emailSchema.safeParse(normalizedEmail);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await sendEmailOtp(supabase, parsed.data);

      if (error) {
        toast.error(error.message ?? "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      toast.success("OTP sent to your email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    const parsed = emailSchema.safeParse(normalizedEmail);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await verifyEmailOtp(supabase, parsed.data, otp);

      if (error) {
        toast.error(error.message ?? "Invalid OTP");
        return;
      }

      if (data.user) {
        onVerified(data.user.id, parsed.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Text size="sm" className="text-muted-foreground">
        {otpSent
          ? "Enter the 6-digit code we sent to your email."
          : "We will send a one-time code to your email."}
      </Text>

      <FormField label="Email" htmlFor="otp-email">
        <FormInput id="otp-email" type="email" value={normalizedEmail} readOnly />
      </FormField>

      {!otpSent ? (
        <Button
          variant="booking"
          className="touch-target min-h-12 w-full"
          onClick={() => void handleSendOtp()}
          disabled={loading}
        >
          Send email OTP
        </Button>
      ) : (
        <>
          <FormField label="One-time password" htmlFor="otp">
            <FormInput
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
            />
          </FormField>
          <Button
            variant="booking"
            className="touch-target min-h-12 w-full"
            onClick={() => void handleVerifyOtp()}
            disabled={loading}
          >
            Verify &amp; Sign In
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void handleSendOtp()}
            disabled={loading}
          >
            Resend OTP
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          setOtp("");
          setOtpSent(false);
          onBack();
        }}
      >
        Back
      </Button>
    </div>
  );
}
