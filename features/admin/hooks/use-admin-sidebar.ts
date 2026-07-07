"use client";

import { useCallback, useEffect, useState } from "react";

import { ADMIN_SIDEBAR_COLLAPSED_KEY } from "@/features/admin/constants/storage";

export function useAdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return { collapsed, toggleCollapsed, hydrated };
}
