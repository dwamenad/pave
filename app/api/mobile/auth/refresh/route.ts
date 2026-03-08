import { NextRequest, NextResponse } from "next/server";
import type { MobileRefreshRequest } from "@pave/contracts";
import { rotateMobileRefreshToken } from "@/lib/server/mobile-auth-service";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as MobileRefreshRequest | null;
  if (!body?.refreshToken) {
    return NextResponse.json({ error: "refreshToken is required" }, { status: 400 });
  }

  const rotated = await rotateMobileRefreshToken(body.refreshToken);
  if (!rotated) {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  return NextResponse.json(rotated);
}
