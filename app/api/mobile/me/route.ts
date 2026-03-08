import { NextRequest, NextResponse } from "next/server";
import type { MobileMeResponse } from "@pave/contracts";
import { requireMobileUser } from "@/lib/server/mobile-route-user";

export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (!auth.user) return auth.response!;

  const payload: MobileMeResponse = {
    user: {
      id: auth.user.id,
      email: auth.user.email,
      username: auth.user.username,
      name: auth.user.name,
      image: auth.user.image,
      bio: auth.user.bio
    }
  };

  return NextResponse.json(payload);
}
