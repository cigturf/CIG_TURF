"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminLoginEmail } from "@/features/auth/config/auth.config";
import {
  getProfileById,
  isAdminUser,
  isProfileComplete,
} from "@/features/auth/services";
import { saveCustomerProfile } from "@/features/auth/services/save-customer-profile.service";
import type { AuthUser } from "@/features/auth/types";
import { passwordSchema } from "@/lib/validations/common";

export async function checkIsAdminAction(userId: string): Promise<boolean> {
  return isAdminUser(userId);
}

export async function checkProfileCompleteAction(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId);
  return isProfileComplete(profile);
}

export async function completeProfileAction(data: {
  name: string;
  phone: string;
}): Promise<{ success: boolean; error?: string; email?: string }> {
  const result = await saveCustomerProfile({
    name: data.name,
    phone: data.phone,
    context: "auth",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, email: result.email };
}

export async function getSessionUserAction(): Promise<AuthUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const profile = await getProfileById(user.id);

  return {
    id: user.id,
    email: user.email,
    name: profile?.name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    phone: profile?.phone ?? null,
    profileComplete: isProfileComplete(profile),
    image: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

const SIGN_IN_TIMEOUT_MS = 15_000;

/**
 * Supabase's client can surface a raw, unparsed response body (e.g. "{}")
 * as the error message when its API returns a malformed 5xx during an
 * outage, instead of a real message. Filter that out in favor of a
 * status-aware, human-readable fallback.
 */
function toUserFacingAuthError(
  error: { message?: string; status?: number } | null | undefined,
  fallback: string,
): string {
  const message = error?.message?.trim();
  const looksUnusable = !message || /^[{[]/.test(message) || message === "[object Object]";

  if (!looksUnusable) return message;

  if (error?.status && error.status >= 500) {
    return "Our sign-in service is temporarily unavailable. Please try again in a few minutes.";
  }

  return fallback;
}

export async function signInWithPasswordAction(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("timeout")),
          SIGN_IN_TIMEOUT_MS,
        ),
      ),
    ]);

    if (error || !data.user) {
      if (error) {
        console.error("[signInWithPasswordAction] Supabase error:", {
          message: error.message,
          status: error.status,
          code: error.code,
        });
      }
      // Never surface Supabase's actual message here (avoids leaking whether
      // an account exists) — except for a genuine service outage, where the
      // honest answer isn't "wrong password".
      const isServiceOutage = Boolean(error?.status && error.status >= 500);
      return {
        success: false,
        error: isServiceOutage
          ? "Our sign-in service is temporarily unavailable. Please try again in a few minutes."
          : "Invalid email or password",
      };
    }

    return { success: true, userId: data.user.id };
  } catch (error) {
    console.error("[signInWithPasswordAction] Unexpected error:", error);
    return {
      success: false,
      error: "Sign-in is taking too long to respond. Please try again in a moment.",
    };
  }
}

/**
 * Changes the signed-in admin's password, but only after re-verifying the
 * current password via a real sign-in — so a hijacked/unlocked session alone
 * is never enough to change it. Re-signing in with the CORRECT password just
 * re-issues the same session (harmless); an incorrect one leaves the current
 * session and password untouched.
 */
export async function changeAdminPasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { success: false, error: "You must be signed in to change your password" };
    }
    if (!isAdminLoginEmail(user.email)) {
      return { success: false, error: "Password change is only available for the admin account" };
    }

    const parsedNewPassword = passwordSchema.safeParse(newPassword);
    if (!parsedNewPassword.success) {
      return {
        success: false,
        error: parsedNewPassword.error.issues[0]?.message ?? "Invalid new password",
      };
    }

    const { error: verifyError } = await Promise.race([
      supabase.auth.signInWithPassword({ email: user.email, password: currentPassword }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS),
      ),
    ]);

    if (verifyError) {
      return { success: false, error: "Current password is incorrect" };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsedNewPassword.data,
    });

    if (updateError) {
      console.error("[changeAdminPasswordAction] Supabase error:", {
        message: updateError.message,
        status: updateError.status,
        code: updateError.code,
      });
      return {
        success: false,
        error: toUserFacingAuthError(updateError, "Failed to update password"),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[changeAdminPasswordAction] Unexpected error:", error);
    return {
      success: false,
      error: "Changing the password is taking too long. Please try again in a moment.",
    };
  }
}

export async function sendEmailOtpAction(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await Promise.race([
      supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS),
      ),
    ]);

    if (error) {
      console.error("[sendEmailOtpAction] Supabase error:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      return { success: false, error: toUserFacingAuthError(error, "Failed to send OTP") };
    }

    return { success: true };
  } catch (error) {
    console.error("[sendEmailOtpAction] Unexpected error:", error);
    return {
      success: false,
      error: "Sending the code is taking too long. Please try again in a moment.",
    };
  }
}

export async function verifyEmailOtpAction(
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await Promise.race([
      supabase.auth.verifyOtp({ email, token, type: "email" }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS),
      ),
    ]);

    if (error || !data.user) {
      if (error) {
        console.error("[verifyEmailOtpAction] Supabase error:", {
          message: error.message,
          status: error.status,
          code: error.code,
        });
      }
      return { success: false, error: toUserFacingAuthError(error, "Invalid OTP") };
    }

    return { success: true, userId: data.user.id };
  } catch (error) {
    console.error("[verifyEmailOtpAction] Unexpected error:", error);
    return {
      success: false,
      error: "Verifying the code is taking too long. Please try again in a moment.",
    };
  }
}
