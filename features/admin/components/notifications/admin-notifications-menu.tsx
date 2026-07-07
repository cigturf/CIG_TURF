"use client";

import {
  Bell,
  CalendarCheck,
  CreditCard,
  Megaphone,
  MessageSquare,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useRealtimeNotifications } from "@/features/realtime/hooks/use-realtime-notifications";
import type { AdminNotificationType } from "@/features/admin/types/admin.types";
import { RelativeTime } from "@/components/common/relative-time";
import { Badge, Button, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS: Record<AdminNotificationType, LucideIcon> = {
  new_booking: CalendarCheck,
  booking_cancelled: XCircle,
  payment_received: CreditCard,
  event_reminder: Megaphone,
  admin_message: MessageSquare,
};

export function AdminNotificationsMenu() {
  const { notifications, unreadCount, markAllRead, markRead } = useRealtimeNotifications();

  return (
    <div className="group relative">
      <Button variant="ghost" size="icon-sm" aria-label="Notifications">
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
            {unreadCount}
          </span>
        ) : null}
      </Button>

      <div
        className={cn(
          "border-border/70 bg-popover absolute top-full right-0 z-50 mt-2 hidden w-80 rounded-[var(--radius-lg)] border p-2 shadow-[var(--shadow-lg)]",
          "group-focus-within:block group-hover:block",
        )}
      >
        <div className="mb-2 flex items-center justify-between px-2 py-1">
          <Text size="sm" className="font-semibold">
            Notifications
          </Text>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-primary text-xs font-medium hover:underline"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => markRead(notification.id)}
                className={cn(
                  "hover:bg-muted/60 w-full rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                  !notification.read && "bg-muted/40",
                )}
              >
                <div className="mb-1 flex items-start gap-2">
                  <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Text size="sm" className="font-medium">
                        {notification.title}
                      </Text>
                      {!notification.read ? <Badge variant="secondary">New</Badge> : null}
                    </div>
                    <Text size="sm" className="text-muted-foreground mt-0.5">
                      {notification.message}
                    </Text>
                    <Text size="sm" className="text-muted-foreground mt-1">
                      <RelativeTime timestamp={notification.createdAt} />
                    </Text>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
