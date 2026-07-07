import type { RealtimeScope, RealtimeTable } from "@/features/realtime/types/realtime.types";

export type RealtimeHubBinding = {
  table: RealtimeTable;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  scopes: RealtimeScope[];
};

/** Postgres bindings registered on the hub channel before subscribe(). */
export const REALTIME_HUB_BINDINGS: RealtimeHubBinding[] = [
  { table: "booked_slots", scopes: ["public", "admin"] },
  { table: "bookings", scopes: ["public", "admin"] },
  { table: "slot_blocks", scopes: ["public", "admin"] },
  { table: "slot_holidays", scopes: ["public", "admin"] },
  { table: "pricing_rules", scopes: ["public", "admin"] },
  { table: "business_settings", filter: "id=eq.default", scopes: ["public", "admin"] },
  { table: "media_assets", scopes: ["public", "admin"] },
  { table: "promotional_content", scopes: ["public", "admin"] },
  { table: "booking_payment_records", scopes: ["admin"] },
  { table: "payments", scopes: ["admin"] },
  { table: "email_logs", scopes: ["admin"] },
];

export const REALTIME_SCHEMA = "public";

export const REALTIME_ACTIVE_TABLES = REALTIME_HUB_BINDINGS.map((binding) => binding.table);

/** Reserved for future milestones — documented for provider architecture. */
export const REALTIME_FUTURE_TABLES = [
  "slots",
  "gallery",
  "events",
  "notifications",
] as const;
