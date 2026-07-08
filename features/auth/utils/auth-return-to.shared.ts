import { AUTH_ROUTES } from "@/features/auth/types";

export function sanitizeAuthReturnPath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;

  return trimmed;
}

export function resolveAuthReturnPath(
  returnTo: string | null | undefined,
  fallback = AUTH_ROUTES.customer,
): string {
  return sanitizeAuthReturnPath(returnTo) ?? fallback;
}
