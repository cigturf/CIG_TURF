"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AdminNotification } from "@/features/admin/types/admin.types";
import {
  APP_EVENT_TYPES,
  BOOKING_EVENTS,
} from "@/features/events/constants/event-types";
import { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import type { AnyAppEvent } from "@/features/events/types/event.types";

type NotificationRealtimeContextValue = {
  notifications: AdminNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  version: number;
};

const NotificationRealtimeContext = createContext<NotificationRealtimeContextValue | null>(null);

const SEED_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "seed-1",
    type: "admin_message",
    title: "Event bus active",
    message: "Modules now communicate through the application event bus.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

function notificationFromAppEvent(event: AnyAppEvent): AdminNotification | null {
  if (event.type === APP_EVENT_TYPES.BOOKING_CREATED) {
    return {
      id: `notif-${event.id}`,
      type: "new_booking",
      title: "New booking received",
      message: `${event.payload.customerName ?? "Customer"} · ${event.payload.bookingReference ?? event.payload.bookingId}`,
      read: false,
      createdAt: event.timestamp,
    };
  }

  if (event.type === APP_EVENT_TYPES.BOOKING_MANUAL_CREATED) {
    return {
      id: `notif-${event.id}`,
      type: "new_booking",
      title: "Manual booking created",
      message: `${event.payload.bookingReference ?? event.payload.bookingId} added by admin.`,
      read: false,
      createdAt: event.timestamp,
    };
  }

  if (
    event.type === APP_EVENT_TYPES.PAYMENT_COLLECTED ||
    event.type === APP_EVENT_TYPES.BOOKING_PAYMENT_COLLECTED
  ) {
    return {
      id: `notif-${event.id}`,
      type: "payment_received",
      title: "Payment collected",
      message: event.payload.collectedAmount
        ? `₹${event.payload.collectedAmount} collected for ${event.payload.bookingReference ?? "booking"}.`
        : "Offline payment recorded.",
      read: false,
      createdAt: event.timestamp,
    };
  }

  if (event.type === APP_EVENT_TYPES.BOOKING_CANCELLED) {
    return {
      id: `notif-${event.id}`,
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: `${event.payload.bookingReference ?? event.payload.bookingId} was cancelled.`,
      read: false,
      createdAt: event.timestamp,
    };
  }

  if (event.type === APP_EVENT_TYPES.PAYMENT_COMPLETED) {
    return {
      id: `notif-${event.id}`,
      type: "payment_received",
      title: "Payment received",
      message: event.payload.amount
        ? `₹${event.payload.amount} advance collected.`
        : "A new payment was recorded.",
      read: false,
      createdAt: event.timestamp,
    };
  }

  if (event.type === APP_EVENT_TYPES.PAYMENT_FAILED) {
    return {
      id: `notif-${event.id}`,
      type: "admin_message",
      title: "Payment failed",
      message: `Payment ${event.payload.paymentId} could not be completed.`,
      read: false,
      createdAt: event.timestamp,
    };
  }

  return null;
}

export function NotificationRealtimeProvider({ children }: { children: ReactNode }) {
  const publish = useAppEventPublisher();
  const [notifications, setNotifications] = useState<AdminNotification[]>(SEED_NOTIFICATIONS);
  const [version, setVersion] = useState(0);

  const pushNotification = useCallback(
    (notification: AdminNotification) => {
      setNotifications((current) => [notification, ...current].slice(0, 20));
      setVersion((current) => current + 1);

      publish(
        APP_EVENT_TYPES.NOTIFICATION_CREATED,
        {
          notificationId: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
        },
        "client",
      );
    },
    [publish],
  );

  useAppEventSubscriber(
    [...BOOKING_EVENTS, APP_EVENT_TYPES.PAYMENT_COMPLETED, APP_EVENT_TYPES.PAYMENT_FAILED],
    (event) => {
      const notification = notificationFromAppEvent(event as AnyAppEvent);
      if (notification) pushNotification(notification);
    },
  );

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      version,
    }),
    [notifications, unreadCount, markAllRead, markRead, version],
  );

  return (
    <NotificationRealtimeContext.Provider value={value}>
      {children}
    </NotificationRealtimeContext.Provider>
  );
}

export function useRealtimeNotifications() {
  const context = useContext(NotificationRealtimeContext);
  if (!context) {
    throw new Error("useRealtimeNotifications must be used within NotificationRealtimeProvider");
  }
  return context;
}
