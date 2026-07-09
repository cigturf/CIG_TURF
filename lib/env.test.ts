import { describe, expect, it, vi, afterEach } from "vitest";

describe("lib/env client safety", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    delete (globalThis as { window?: unknown }).window;
  });

  it("does not throw when imported in a browser-like environment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://cig-turf.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Chandna Indoor Ground");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_key");

    vi.stubGlobal("window", {} as Window & typeof globalThis);

    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://cig-turf.vercel.app");
  });

  it("requires Razorpay secrets on deployed server startup", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:password@db.example.supabase.co:6543/postgres");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_live_key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://chandnaindoorground.in");
    vi.stubEnv("BREVO_API_KEY", "brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "bookings@example.com");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_key");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");

    await expect(import("@/lib/env")).rejects.toThrow(
      "Missing required production environment variables",
    );
  });
});
