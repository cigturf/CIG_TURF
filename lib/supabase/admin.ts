import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Service-role Supabase client for privileged server operations.
 * Never expose this client to the browser.
 */
export function createServiceRoleClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.server.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
