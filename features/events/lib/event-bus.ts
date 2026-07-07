import type { AppEventType } from "@/features/events/constants/event-types";
import type {
  AppEventEnvelope,
  AppEventHandler,
  AppEventPayloadMap,
  AppEventSource,
} from "@/features/events/types/event.types";

function createEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createAppEventEnvelope<T extends AppEventType>(
  type: T,
  payload: AppEventPayloadMap[T],
  source: AppEventSource = "client",
): AppEventEnvelope<T> {
  return {
    id: createEventId(),
    type,
    payload,
    timestamp: new Date().toISOString(),
    source,
    version: 1,
  };
}

/** JSON-safe serialization for mobile / SSE consumers. */
export function serializeAppEvent(event: AppEventEnvelope): string {
  return JSON.stringify(event);
}

export function parseAppEvent(raw: string): AppEventEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as AppEventEnvelope;
    if (!parsed?.type || !parsed?.payload || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

type ListenerEntry = {
  id: string;
  types: AppEventType[] | "*";
  handler: AppEventHandler;
};

export class EventBus {
  private listeners = new Map<string, ListenerEntry>();
  private history: AppEventEnvelope[] = [];
  private readonly maxHistory = 50;

  publish<T extends AppEventType>(
    type: T,
    payload: AppEventPayloadMap[T],
    source: AppEventSource = "client",
  ): AppEventEnvelope<T> {
    const event = createAppEventEnvelope(type, payload, source);
    this.history = [event, ...this.history].slice(0, this.maxHistory);

    for (const entry of this.listeners.values()) {
      if (entry.types === "*" || entry.types.includes(type)) {
        entry.handler(event);
      }
    }

    return event;
  }

  subscribe(types: AppEventType[] | AppEventType | "*", handler: AppEventHandler): () => void {
    const id = createEventId();
    const normalized = types === "*" ? "*" : Array.isArray(types) ? types : [types];

    this.listeners.set(id, {
      id,
      types: normalized,
      handler,
    });

    return () => {
      this.listeners.delete(id);
    };
  }

  getRecentEvents(limit = 10): AppEventEnvelope[] {
    return this.history.slice(0, limit);
  }

  clear() {
    this.listeners.clear();
    this.history = [];
  }
}

let globalEventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

export function resetEventBusForTests() {
  globalEventBus?.clear();
  globalEventBus = null;
}
