import { NextResponse } from "next/server";

import {
  getCustomerDirectoryData,
  getCustomerProfile,
} from "@/features/admin/customers/services/customer.service";
import type { CustomerFilter } from "@/features/admin/customers/types/customer.types";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("customers.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const customerKey = searchParams.get("customerKey");

  if (customerKey) {
    const profile = await getCustomerProfile(customerKey);
    if (!profile) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  }

  const data = await getCustomerDirectoryData({
    search: searchParams.get("search") ?? undefined,
    filter: (searchParams.get("filter") as CustomerFilter) ?? "all",
  });

  return NextResponse.json(data);
}
