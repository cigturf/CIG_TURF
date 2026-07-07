import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

export function createClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase client environment variables are not configured");
  }

  return createBrowserClient(url, key);
}
