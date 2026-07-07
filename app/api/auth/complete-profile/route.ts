import { NextResponse } from "next/server";

import { completeProfileAction } from "@/features/auth/actions/auth.actions";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; phone?: string };
    const result = await completeProfileAction({
      name: body.name ?? "",
      phone: body.phone ?? "",
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save profile" }, { status: 500 });
  }
}
