import type { Profile } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export { isProfileComplete } from "@/features/auth/utils/profile";

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

async function getProfileViaSupabase(userId: string): Promise<Profile | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, phone, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Profile] Supabase lookup failed:", error.message);
    return null;
  }

  return data ? mapProfile(data as ProfileRow) : null;
}

async function upsertProfileViaSupabase(data: {
  id: string;
  email: string;
  name: string;
  phone: string;
}): Promise<Profile> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured");
  }

  const now = new Date().toISOString();
  const existing = await getProfileViaSupabase(data.id);

  const payload = {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    updated_at: now,
  };

  const query = existing
    ? supabase.from("profiles").update(payload).eq("id", data.id)
    : supabase.from("profiles").insert({ ...payload, created_at: now });

  const { data: row, error } = await query
    .select("id, email, name, phone, created_at, updated_at")
    .single();

  if (error || !row) {
    throw new Error(error?.message ?? "Failed to save profile");
  }

  return mapProfile(row as ProfileRow);
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, phone, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[Profile] Supabase lookup failed:", error.message);
    } else {
      return data ? mapProfile(data as ProfileRow) : null;
    }
  }

  try {
    return await prisma.profile.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    console.error("[Profile] Prisma lookup failed:", error);
    return null;
  }
}

/** @deprecated Use getProfileById */
export async function getProfileByUserId(userId: string) {
  return getProfileById(userId);
}

export async function upsertProfile(data: {
  id: string;
  email: string;
  name: string;
  phone: string;
}): Promise<Profile> {
  try {
    return await upsertProfileViaSupabase(data);
  } catch (supabaseError) {
    console.error("[Profile] Supabase upsert failed:", supabaseError);

    return prisma.profile.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
      },
      update: {
        email: data.email,
        name: data.name,
        phone: data.phone,
      },
    });
  }
}

export async function createProfile(data: {
  userId: string;
  email: string;
  name: string;
  phone: string;
}) {
  return upsertProfile({
    id: data.userId,
    email: data.email,
    name: data.name,
    phone: data.phone,
  });
}
