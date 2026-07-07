import { createClient } from "@/lib/supabase/server";
import { getProfileById, isAdminUser, upsertProfile } from "@/features/auth/services";
import { CommunicationService } from "@/features/communication/services/communication.service";

export type SaveCustomerProfileResult =
  | { success: true; email: string }
  | { success: false; error: string };

export async function saveCustomerProfile(data: {
  name: string;
  phone: string;
  context?: "auth" | "booking";
}): Promise<SaveCustomerProfileResult> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: "Unable to connect. Check your network and try again." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return { success: false, error: "Session expired. Please sign in again." };
  }

  if (await isAdminUser(user.id)) {
    return {
      success: false,
      error:
        data.context === "booking"
          ? "Admin accounts cannot book as customers."
          : "Admin accounts do not require profile completion",
    };
  }

  try {
    const existingProfile = await getProfileById(user.id);
    await upsertProfile({
      id: user.id,
      email: user.email,
      name: data.name,
      phone: data.phone,
    });

    if (!existingProfile) {
      void CommunicationService.sendWelcomeEmail({
        email: user.email,
        customerName: data.name,
      }).catch((error) => {
        console.error("[SaveCustomerProfile] Welcome email failed:", error);
      });
    }

    return { success: true, email: user.email };
  } catch {
    return { success: false, error: "Failed to save profile. Please try again." };
  }
}
