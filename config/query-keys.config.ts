export const QUERY_KEYS = {
  auth: {
    session: ["auth", "session"] as const,
  },
  businessSettings: {
    all: ["business-settings"] as const,
    public: ["business-settings", "public"] as const,
  },
  config: {
    app: ["config", "app"] as const,
  },
  pricing: {
    active: ["pricing", "active"] as const,
    admin: ["pricing", "admin"] as const,
  },
  slots: {
    availability: (dateIso: string) => ["slots", "availability", dateIso] as const,
  },
  media: {
    public: (category?: string) => ["public", "media", category ?? "all"] as const,
  },
  promotions: {
    public: (location?: string) => ["public", "promotions", location ?? "all"] as const,
    announcement: ["public", "promotions", "announcement"] as const,
  },
} as const;
