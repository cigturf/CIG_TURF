import type { AuthUser } from "@/features/auth/types";

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Client auth helpers use API routes instead of Server Actions to avoid stale action IDs after dev rebuilds. */
export async function fetchSessionUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const data = await parseJson<{ user: AuthUser | null }>(response);
  return data?.user ?? null;
}

export async function submitCompleteProfile(data: {
  name: string;
  phone: string;
}): Promise<{ success: boolean; error?: string; email?: string }> {
  const response = await fetch("/api/auth/complete-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(data),
  });
  const result = await parseJson<{ success: boolean; error?: string; email?: string }>(response);
  return result ?? { success: false, error: "Failed to save profile" };
}

export async function submitBookingProfile(data: {
  name: string;
  phone: string;
}): Promise<{ success: boolean; error?: string; email?: string }> {
  const response = await fetch("/api/bookings/save-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(data),
  });
  const result = await parseJson<{ success: boolean; error?: string; email?: string }>(response);
  return result ?? { success: false, error: "Failed to save profile" };
}
