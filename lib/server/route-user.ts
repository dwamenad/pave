import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return { user, response: null };
}
