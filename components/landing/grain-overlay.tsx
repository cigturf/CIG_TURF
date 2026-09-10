const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * A barely-there film-grain texture over the whole page — the kind of detail
 * that reads as "shot on a premium camera" rather than "flat gradient",
 * without ever calling attention to itself.
 */
export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.035] mix-blend-overlay"
      style={{ backgroundImage: `url("${NOISE_SVG}")` }}
    />
  );
}
