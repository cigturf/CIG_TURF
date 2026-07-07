import type { Profile } from "@/app/generated/prisma/client";

export function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(profile?.name?.trim() && profile?.phone?.trim());
}
