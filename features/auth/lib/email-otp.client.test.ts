import { describe, expect, it, vi } from "vitest";

import { sendEmailOtp, verifyEmailOtp } from "@/features/auth/lib/email-otp.client";

describe("email-otp.client", () => {
  it("sends email OTP without emailRedirectTo", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const supabase = { auth: { signInWithOtp } } as never;

    await sendEmailOtp(supabase, "player@example.com");

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "player@example.com",
      options: { shouldCreateUser: true },
    });
    expect(signInWithOtp.mock.calls[0]?.[0]?.options?.emailRedirectTo).toBeUndefined();
  });

  it("verifies email OTP with type email", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const supabase = { auth: { verifyOtp } } as never;

    await verifyEmailOtp(supabase, "player@example.com", "123456");

    expect(verifyOtp).toHaveBeenCalledWith({
      email: "player@example.com",
      token: "123456",
      type: "email",
    });
  });
});
