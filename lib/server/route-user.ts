import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveMobileActor } from "@/lib/server/mobile-route-user";

export async function getApiActor(request: NextRequest) {
  const mobile = await resolveMobileActor(request);
  if (mobile.user) {
    return {
      user: mobile.user,
      authMode: "mobile" as const,
      mobileSession: mobile.session
    };
  }

  const user = await getCurrentUser();
  if (!user) return null;

  return {
    user,
    authMode: "web" as const,
    mobileSession: null
  };
}

export async function requireApiUser(request: NextRequest) {
  const actor = await getApiActor(request);
  if (!actor?.user) {
    return {
      user: null,
      actor: null,
      response: NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 })
    };
  }

  return { user: actor.user, actor, response: null };
}
