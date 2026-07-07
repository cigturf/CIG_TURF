import { createServiceRoleClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function getCustomerNotesMap(): Promise<Record<string, string | null>> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase.from("customer_directory_notes").select("*");
    if (!error && data) {
      return Object.fromEntries(
        data.map((row) => [row.customer_key as string, (row.notes as string | null) ?? null]),
      );
    }
  }

  try {
    const rows = await prisma.customerDirectoryNote.findMany();
    return Object.fromEntries(rows.map((row) => [row.customerKey, row.notes]));
  } catch {
    return {};
  }
}

export async function getCustomerNote(customerKey: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("customer_directory_notes")
      .select("notes")
      .eq("customer_key", customerKey)
      .maybeSingle();
    if (!error && data) return (data.notes as string | null) ?? null;
  }

  try {
    const row = await prisma.customerDirectoryNote.findUnique({
      where: { customerKey },
    });
    return row?.notes ?? null;
  } catch {
    return null;
  }
}

export async function upsertCustomerNote(
  customerKey: string,
  notes: string | null,
  updatedBy: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const payload = {
    customer_key: customerKey,
    notes,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("customer_directory_notes")
      .upsert(payload, { onConflict: "customer_key" })
      .select("notes")
      .single();
    if (!error && data) return (data.notes as string | null) ?? null;
    if (error) throw new Error(error.message);
  }

  const row = await prisma.customerDirectoryNote.upsert({
    where: { customerKey },
    create: {
      customerKey,
      notes,
      updatedBy,
    },
    update: {
      notes,
      updatedBy,
    },
  });

  return row.notes;
}
