/**
 * Resolves an iframe-safe Google Maps embed URL.
 * Short share links (maps.app.goo.gl) cannot be embedded — fall back to address query.
 */
export function resolveGoogleMapsEmbedUrl(
  googleMapsLink: string | null | undefined,
  fullAddress: string | null | undefined,
): string | null {
  const link = googleMapsLink?.trim();
  const address = fullAddress?.trim();

  if (link?.includes("/maps/embed")) {
    return link;
  }

  if (address) {
    const params = new URLSearchParams({
      q: address,
      hl: "en",
      z: "15",
      output: "embed",
    });
    return `https://maps.google.com/maps?${params.toString()}`;
  }

  if (!link) return null;

  const isShortLink =
    link.includes("goo.gl") || link.includes("maps.app") || link.includes("google.com/maps/dir");

  if (isShortLink) return null;

  const params = new URLSearchParams({
    q: link,
    hl: "en",
    z: "15",
    output: "embed",
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}
