import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type LiveLandingStats = {
  matchesPlayed: number;
  happyPlayers: number;
  teamsHosted: number;
};

/** Every booking is a two-team match with roughly this many players a side. */
const PLAYERS_PER_MATCH = 5;
const TEAMS_PER_MATCH = 2;

async function countNonCancelledBookings(): Promise<number> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .neq("status", "cancelled");
    if (!error && count !== null) return count;
  }

  try {
    return await prisma.booking.count({ where: { status: { not: "cancelled" } } });
  } catch {
    return 0;
  }
}

/**
 * Live "By the numbers" stats for the landing page, derived from real
 * bookings rather than admin-typed numbers. Every non-cancelled booking
 * counts as a match played by two teams of ~5 players each.
 */
export async function getLiveLandingStats(): Promise<LiveLandingStats> {
  const matchesPlayed = await countNonCancelledBookings();
  return {
    matchesPlayed,
    happyPlayers: matchesPlayed * PLAYERS_PER_MATCH,
    teamsHosted: matchesPlayed * TEAMS_PER_MATCH,
  };
}
