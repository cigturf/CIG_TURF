import { describe, expect, it, vi, afterEach } from "vitest";

describe("lib/env client safety", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
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
});
