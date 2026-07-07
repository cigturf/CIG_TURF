"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { toast } from "sonner";

import { submitCompleteProfile } from "@/features/auth/lib/auth-client-api";
import { isAdminLoginEmail } from "@/features/auth/config/auth.config";
import { useAuthSession } from "@/features/auth/hooks";
import { AUTH_ROUTES, type LoginMode } from "@/features/auth/types";
import { buildAuthContinueUrl } from "@/features/auth/utils/redirect";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
import {
  Button,
  Display,
  FormField,
  FormInput,
  LAYOUT,
  Text,
} from "@/components/design-system";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, passwordSchema, phoneSchema } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

export function AuthPage() {
  const publish = useAppEventPublisher();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, isPending, isAuthenticated } = useAuthSession();

  const [mode, setMode] = useState<LoginMode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);

  const continueAfterAuth = useCallback(() => {
    window.location.assign(buildAuthContinueUrl(returnTo));
  }, [returnTo]);

  useEffect(() => {
    if (!isPending && isAuthenticated && user && mode !== "onboarding") {
      if (!user.profileComplete && returnTo !== AUTH_ROUTES.bookingDetails) {
        setMode("onboarding");
        return;
      }

      continueAfterAuth();
    }
  }, [isPending, isAuthenticated, user, mode, returnTo, continueAfterAuth]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const nextPath = returnTo ?? AUTH_ROUTES.customer;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        toast.error(error.message ?? "Google sign-in is not available. Check configuration.");
      }
    } catch {
      toast.error("Google sign-in is not available. Check configuration.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (targetEmail = email) => {
    const parsed = emailSchema.safeParse(targetEmail);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { shouldCreateUser: true },
      });

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

  const handleEmailContinue = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    const normalizedEmail = parsed.data.toLowerCase();
    setEmail(normalizedEmail);
    setPassword("");
    setOtp("");
    setOtpSent(false);

    if (isAdminLoginEmail(normalizedEmail)) {
      setMode("admin-signin");
      return;
    }

    setMode("email-otp");
    await sendOtp(normalizedEmail);
  };

  const handlePasswordSignIn = async () => {
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedEmail.success) {
      toast.error("Invalid email");
      return;
    }
    if (!isAdminLoginEmail(parsedEmail.data)) {
      toast.error("Password sign-in is only available for admin accounts.");
      setMode("email-otp");
      await sendOtp(parsedEmail.data);
      return;
    }
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsedEmail.data,
        password: parsedPassword.data,
      });

      if (error) {
        publish(APP_EVENT_TYPES.AUTH_LOGIN_FAILED, { email: parsedEmail.data });
        toast.error("Invalid email or password");
        return;
      }

      if (data.user) {
        publish(APP_EVENT_TYPES.AUTH_LOGIN_SUCCESS, {
          userId: data.user.id,
          email: parsedEmail.data,
        });
        continueAfterAuth();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    await sendOtp();
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        toast.error(error.message ?? "Invalid OTP");
        return;
      }

      if (data.user) {
        publish(APP_EVENT_TYPES.AUTH_LOGIN_SUCCESS, {
          userId: data.user.id,
          email,
        });
        continueAfterAuth();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message ?? "Failed to send reset link");
        return;
      }

      setResetLinkSent(true);
      publish(APP_EVENT_TYPES.AUTH_PASSWORD_RESET, { email });
      toast.success("If an account exists, a reset link has been sent to your email");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      toast.error("Enter your full name");
      return;
    }
    const parsedPhone = phoneSchema.safeParse(phone);
    if (!parsedPhone.success) {
      toast.error(parsedPhone.error.issues[0]?.message ?? "Invalid phone");
      return;
    }

    setLoading(true);
    try {
      const result = await submitCompleteProfile({
        name: name.trim(),
        phone: parsedPhone.data,
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to save profile");
        return;
      }
      toast.success("Profile saved");
      continueAfterAuth();
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={cn(LAYOUT.containerMd, "flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-10 sm:py-14")}>
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" />
        Back
      </Link>

      <div className="mx-auto w-full max-w-md">
        <Display size="sm" className="text-foreground mb-2 text-center sm:text-left">
          {mode === "onboarding" ? "Complete your profile" : "Welcome"}
        </Display>
        <Text className="text-muted-foreground mb-8 text-center sm:text-left">
          {mode === "onboarding"
            ? "Just a few details before you continue."
            : "Sign in to book your slot or manage your profile."}
        </Text>

        <div className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6 shadow-[var(--shadow-sm)] sm:p-8">
          {mode === "choose" && (
            <div className="space-y-4">
              <Button
                variant="booking"
                className="touch-target min-h-12 w-full text-base"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Continue with Google
              </Button>

              <div className="relative py-2">
                <div className="border-border/60 absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card text-muted-foreground px-2">or</span>
                </div>
              </div>

              <FormField label="Email" htmlFor="email">
                <FormInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </FormField>

              <Button
                variant="outline"
                className="touch-target min-h-12 w-full"
                onClick={handleEmailContinue}
                disabled={loading}
              >
                <Mail className="size-4" />
                Continue with Email
              </Button>
            </div>
          )}

          {mode === "admin-signin" && (
            <div className="space-y-4">
              <Text size="sm" className="text-muted-foreground">
                Admin sign-in
              </Text>

              <FormField label="Email" htmlFor="signin-email">
                <FormInput id="signin-email" type="email" value={email} readOnly />
              </FormField>

              <FormField label="Password" htmlFor="signin-password">
                <FormInput
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </FormField>

              <Button
                variant="booking"
                className="touch-target min-h-12 w-full"
                onClick={handlePasswordSignIn}
                disabled={loading}
              >
                Sign in
              </Button>

              <button
                type="button"
                className="text-primary w-full text-center text-sm hover:underline"
                onClick={() => setMode("forgot-password")}
              >
                Forgot password?
              </button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode("choose");
                  setPassword("");
                }}
              >
                Back
              </Button>
            </div>
          )}

          {mode === "email-otp" && (
            <div className="space-y-4">
              <Text size="sm" className="text-muted-foreground">
                We sent a one-time code to your email. Enter it below to sign in.
              </Text>

              <FormField label="Email" htmlFor="otp-email">
                <FormInput id="otp-email" type="email" value={email} readOnly />
              </FormField>

              {!otpSent ? (
                <Button
                  variant="booking"
                  className="touch-target min-h-12 w-full"
                  onClick={handleSendOtp}
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
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                  </FormField>
                  <Button
                    variant="booking"
                    className="touch-target min-h-12 w-full"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    Verify &amp; Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSendOtp}
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
                  setMode("choose");
                  setOtp("");
                  setOtpSent(false);
                }}
              >
                Back
              </Button>
            </div>
          )}

          {mode === "forgot-password" && (
            <div className="space-y-4">
              <Text size="sm" className="text-muted-foreground">
                Reset your password
              </Text>
              <FormField label="Email" htmlFor="reset-email">
                <FormInput id="reset-email" type="email" value={email} readOnly />
              </FormField>

              {!resetLinkSent ? (
                <Button
                  variant="booking"
                  className="touch-target min-h-12 w-full"
                  onClick={handleSendResetLink}
                  disabled={loading}
                >
                  Send reset link
                </Button>
              ) : (
                <Text size="sm" className="text-muted-foreground text-center">
                  If an account exists, check your email for a password reset link.
                </Text>
              )}

              <Button variant="ghost" className="w-full" onClick={() => setMode("admin-signin")}>
                Back to sign in
              </Button>
            </div>
          )}

          {mode === "onboarding" && (
            <div className="space-y-4">
              <FormField label="Full name" htmlFor="name" required>
                <FormInput
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </FormField>
              <FormField label="Phone number" htmlFor="phone" required>
                <FormInput
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile"
                />
              </FormField>
              <FormField label="Email" htmlFor="profile-email">
                <FormInput
                  id="profile-email"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="bg-muted/40"
                />
              </FormField>
              <Button
                variant="booking"
                className="touch-target min-h-12 w-full"
                onClick={handleCompleteProfile}
                disabled={loading}
              >
                Save &amp; continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
