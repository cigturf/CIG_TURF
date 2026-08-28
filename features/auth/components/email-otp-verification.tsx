"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { sendEmailOtpAction, verifyEmailOtpAction } from "@/features/auth/actions";
import { Button, FormField, FormInput, Text } from "@/components/design-system";
import { emailSchema } from "@/lib/validations/common";

type EmailOtpVerificationProps = {
  email: string;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onVerified: (userId: string, email: string) => void;
  onBack: () => void;
};

// Matches the provider's minimum resend interval per recipient, so the
// countdown reflects a real constraint rather than an arbitrary UI delay.
const RESEND_COOLDOWN_SECONDS = 60;

export function EmailOtpVerification({
  email,
  loading: externalLoading = false,
  onLoadingChange,
  onVerified,
  onBack,
}: EmailOtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(null);
      } else {
        setNow(Date.now());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownSeconds = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;

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
      const result = await sendEmailOtpAction(parsed.data);

      if (!result.success) {
        toast.error(result.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setNow(Date.now());
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      toast.success("OTP sent to your email");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void handleSendOtp();
    // Auto-send once when this screen mounts; handleSendOtp reads
    // otp-independent state and setting otpSent itself, so it's safe to
    // omit from deps — re-running it on every render would resend the OTP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) {
      toast.error("Enter the OTP from your email");
      return;
    }

    const parsed = emailSchema.safeParse(normalizedEmail);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmailOtpAction(parsed.data, otp.trim());

      if (!result.success || !result.userId) {
        toast.error(result.error || "Invalid OTP");
        return;
      }

      onVerified(result.userId, parsed.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Text size="sm" className="text-muted-foreground">
        {otpSent
          ? "Enter the code we sent to your email."
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
              maxLength={16}
              placeholder="Enter the code from your email"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\s/g, ""))}
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
            disabled={loading || cooldownSeconds > 0}
          >
            {cooldownSeconds > 0 ? `Resend OTP in ${cooldownSeconds}s` : "Resend OTP"}
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
