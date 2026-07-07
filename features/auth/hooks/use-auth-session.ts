"use client";

import { useCallback, useEffect, useState } from "react";

import type { AuthUser } from "@/features/auth/types";
import { fetchSessionUser } from "@/features/auth/lib/auth-client-api";
import { createClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const sessionUser = await fetchSessionUser();
      setUser(sessionUser);
    } catch {
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        setIsPending(true);
        void loadUser();
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setIsPending(false);
      return undefined;
    }
  }, [loadUser]);

  return {
    user: user ?? undefined,
    session: user,
    isPending,
    isAuthenticated: Boolean(user),
  };
}

export async function signOutClient() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
