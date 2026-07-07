"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AUTH_ROUTES } from "@/features/auth/types";
import { Button, Display, FormField, FormInput, LAYOUT, Text } from "@/components/design-system";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validations/common";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async () => {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: parsed.data });

      if (error) {
        toast.error(error.message ?? "Failed to update password");
        return;
      }

      toast.success("Password updated successfully");
      router.push(AUTH_ROUTES.admin);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${LAYOUT.containerMd} surface-public min-h-screen py-10 sm:py-14`}>
      <div className="mx-auto w-full max-w-md">
        <Display size="sm" className="text-foreground mb-2">
          Reset password
        </Display>
        <Text className="text-muted-foreground mb-8">
          Choose a new password for your admin account.
        </Text>

        <div className="border-border/70 bg-card rounded-[var(--radius-2xl)] border p-6 shadow-[var(--shadow-sm)] sm:p-8">
          {!ready ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              <FormField label="New password" htmlFor="new-password">
                <FormInput
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirm password" htmlFor="confirm-password">
                <FormInput
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <Button
                variant="booking"
                className="touch-target min-h-12 w-full"
                onClick={handleReset}
                disabled={loading}
              >
                Update password
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
