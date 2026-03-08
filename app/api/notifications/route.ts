import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/server/social-service";
import { requireApiUser } from "@/lib/server/route-user";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const notifications = await getNotifications(auth.user.id, cursor);
  return NextResponse.json(notifications);
}
