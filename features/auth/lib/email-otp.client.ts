import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sends a 6-digit email OTP. Do not pass `emailRedirectTo` — that switches
 * Supabase to magic-link emails instead of an OTP code.
 */
export async function sendEmailOtp(supabase: SupabaseClient, email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });
}

export async function verifyEmailOtp(
  supabase: SupabaseClient,
  email: string,
  token: string,
) {
  return supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
}
