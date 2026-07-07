/** Normalize media URLs to same-origin relative paths for next/image and routing. */
export function normalizeAppMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (trimmed.startsWith("/api/media/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.pathname.startsWith("/api/media/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
