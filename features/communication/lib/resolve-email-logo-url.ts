import { getAppConfig } from "@/config/app.config";
import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";
import { resolvePublicLogoUrl } from "@/features/media/services/resolve-public-media";

/** PNG mark on white email cards — SVG is poorly supported in email clients. */
const DEFAULT_EMAIL_LOGO_PATH = "/branding/logo-dark.png";

function getAppOrigin(): string {
  return getAppConfig().url.replace(/\/$/, "");
}

export function toAbsoluteAppUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const normalized = normalizeAppMediaUrl(trimmed);
    if (normalized?.startsWith("/")) {
      return `${getAppOrigin()}${normalized}`;
    }
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${getAppOrigin()}${trimmed}`;
  }

  return trimmed;
}

function isUnsupportedEmailImage(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith(".svg") || lower.includes(".svg?");
}

/**
 * Email clients require absolute HTTPS URLs. Relative `/api/media/*` paths and SVG
 * assets used on the site do not render in Gmail, Apple Mail, etc.
 */
export async function resolveEmailLogoUrl(logoUrl: string | null): Promise<string> {
  let candidate = logoUrl ? (normalizeAppMediaUrl(logoUrl) ?? logoUrl.trim()) : null;

  if (!candidate) {
    candidate = await resolvePublicLogoUrl();
  }

  if (candidate && !isUnsupportedEmailImage(candidate)) {
    return toAbsoluteAppUrl(candidate);
  }

  return toAbsoluteAppUrl(DEFAULT_EMAIL_LOGO_PATH);
}
