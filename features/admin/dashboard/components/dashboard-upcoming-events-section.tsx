import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ADMIN_ROUTES } from "@/features/admin/config/admin-navigation";
import type { DashboardUpcomingEvent } from "@/features/admin/dashboard/types/dashboard.types";
import {
  AnalyticsCard,
  Badge,
  Button,
  EmptyState,
  Text,
} from "@/components/design-system";

const EVENT_TYPE_LABELS: Record<DashboardUpcomingEvent["type"], string> = {
  tournament: "Tournament",
  league: "League",
  camp: "Practice Camp",
  offer: "Special Offer",
};

type DashboardUpcomingEventsSectionProps = {
  events: DashboardUpcomingEvent[];
};

function formatEventDate(startDate: string, endDate?: string | null) {
  const start = new Date(`${startDate}T00:00:00`);
  const startLabel = start.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  if (!endDate || endDate === startDate) {
    return startLabel;
  }

  const end = new Date(`${endDate}T00:00:00`);
  const endLabel = end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return `${startLabel} – ${endLabel}`;
}

export function DashboardUpcomingEventsSection({
  events,
}: DashboardUpcomingEventsSectionProps) {
  return (
    <AnalyticsCard
      title="Upcoming Events"
      description="Future tournaments, leagues, and promotions"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href={ADMIN_ROUTES.events}>Manage</Link>
        </Button>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No upcoming events"
          description="Events configured in Business Settings will appear here."
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border-border/60 hover:bg-muted/20 rounded-[var(--radius-md)] border px-3 py-3 transition-colors"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Text className="font-medium">{event.title}</Text>
                <Badge variant="secondary">{EVENT_TYPE_LABELS[event.type]}</Badge>
                {!event.configured ? <Badge variant="outline">Preview</Badge> : null}
              </div>
              <Text size="sm" className="text-muted-foreground">
                {formatEventDate(event.startDate, event.endDate)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}
