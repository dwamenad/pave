import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/server/mobile-auth-tokens";

function unauthorized(message = "Unauthorized") {
  return {
    user: null,
    session: null,
    response: NextResponse.json({ error: message }, { status: 401 })
  };
}

function readBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim();
}

export async function requireMobileUser(request: NextRequest) {
  const token = readBearerToken(request);
  if (!token) return unauthorized("Missing bearer token");

  const claims = verifyAccessToken(token);
  if (!claims) return unauthorized("Invalid access token");

  const session = await db.mobileSession.findUnique({
    where: { id: claims.sid },
    include: { user: true }
  });

  if (!session || !session.user) return unauthorized("Session not found");
  if (session.revokedAt) return unauthorized("Session revoked");
  if (session.expiresAt <= new Date()) return unauthorized("Session expired");
  if (session.accessTokenJti !== claims.jti) return unauthorized("Session token mismatch");
  if (session.refreshTokenVersion !== claims.ver) return unauthorized("Session token version mismatch");

  await db.mobileSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return {
    user: session.user,
    session,
    response: null as NextResponse | null
  };
}
