import { getAppConfig } from "@/config/app.config";
import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";

/** Light mark on black email header — JPG for broad client support. */
const DEFAULT_EMAIL_LOGO_PATH = "/branding/cig-light.jpg";

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

/**
 * Transactional emails use the light mark on a black header (see email-layout.ts).
 * Admin-uploaded SVG/remote logos are not used — JPG at a stable public path is required
 * for Gmail, Apple Mail, etc.
 */
export async function resolveEmailLogoUrl(_logoUrl?: string | null): Promise<string> {
  void _logoUrl;
  return toAbsoluteAppUrl(DEFAULT_EMAIL_LOGO_PATH);
}
