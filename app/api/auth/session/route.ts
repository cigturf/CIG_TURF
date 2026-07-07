import { NextResponse } from "next/server";

import { getSessionUserAction } from "@/features/auth/actions/auth.actions";

export async function GET() {
  try {
    const user = await getSessionUserAction();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
