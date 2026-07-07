/** Shared client cache TTLs (milliseconds). */
export const CACHE_TTL = {
  defaultStale: 60_000,
  defaultGc: 10 * 60_000,
  businessSettings: 5 * 60_000,
  pricing: 5 * 60_000,
  slots: 30_000,
  publicMedia: 5 * 60_000,
  publicPromotions: 2 * 60_000,
  adminRefreshDebounce: 400,
} as const;

/** HTTP cache max-age (seconds) for public API routes. */
export const API_CACHE_SECONDS = {
  pricing: 60,
  media: 120,
  slots: 30,
  businessSettings: 120,
} as const;

export const ADMIN_LIST_LIMIT = 200;
