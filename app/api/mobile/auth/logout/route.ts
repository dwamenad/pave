import { NextRequest, NextResponse } from "next/server";
import type { MobileLogoutRequest } from "@pave/contracts";
import { revokeMobileSessionByRefreshToken } from "@/lib/server/mobile-auth-service";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as MobileLogoutRequest | null;
  if (!body?.refreshToken) {
    return NextResponse.json({ error: "refreshToken is required" }, { status: 400 });
  }

  const revoked = await revokeMobileSessionByRefreshToken(body.refreshToken);
  if (!revoked) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
