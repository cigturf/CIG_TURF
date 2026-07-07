"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getProfileById,
  isAdminUser,
  isProfileComplete,
} from "@/features/auth/services";
import { saveCustomerProfile } from "@/features/auth/services/save-customer-profile.service";
import type { AuthUser } from "@/features/auth/types";

export async function checkIsAdminAction(userId: string): Promise<boolean> {
  return isAdminUser(userId);
}

export async function checkProfileCompleteAction(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId);
  return isProfileComplete(profile);
}

export async function completeProfileAction(data: {
  name: string;
  phone: string;
}): Promise<{ success: boolean; error?: string; email?: string }> {
  const result = await saveCustomerProfile({
    name: data.name,
    phone: data.phone,
    context: "auth",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, email: result.email };
}

export async function getSessionUserAction(): Promise<AuthUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const profile = await getProfileById(user.id);

  return {
    id: user.id,
    email: user.email,
    name: profile?.name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    phone: profile?.phone ?? null,
    profileComplete: isProfileComplete(profile),
    image: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
