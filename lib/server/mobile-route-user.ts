import { NextRequest, NextResponse } from "next/server";
import type { MobileSession, User } from "@prisma/client";
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

type ResolveMobileActorResult = {
  user: User | null;
  session: MobileSession | null;
  error: string | null;
};

export async function resolveMobileActor(
  request: NextRequest,
  options?: {
    touchSession?: boolean;
  }
): Promise<ResolveMobileActorResult> {
  const touchSession = options?.touchSession ?? true;
  const token = readBearerToken(request);
  if (!token) {
    return {
      user: null,
      session: null,
      error: "Missing bearer token"
    };
  }

  const claims = verifyAccessToken(token);
  if (!claims) {
    return {
      user: null,
      session: null,
      error: "Invalid access token"
    };
  }

  const session = await db.mobileSession.findUnique({
    where: { id: claims.sid },
    include: { user: true }
  });

  if (!session || !session.user) {
    return {
      user: null,
      session: null,
      error: "Session not found"
    };
  }
  if (session.revokedAt) {
    return {
      user: null,
      session: null,
      error: "Session revoked"
    };
  }
  if (session.expiresAt <= new Date()) {
    return {
      user: null,
      session: null,
      error: "Session expired"
    };
  }
  if (session.accessTokenJti !== claims.jti) {
    return {
      user: null,
      session: null,
      error: "Session token mismatch"
    };
  }
  if (session.refreshTokenVersion !== claims.ver) {
    return {
      user: null,
      session: null,
      error: "Session token version mismatch"
    };
  }

  if (touchSession) {
    await db.mobileSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() }
    });
  }

  return {
    user: session.user,
    session,
    error: null
  };
}

export async function requireMobileUser(request: NextRequest) {
  const resolved = await resolveMobileActor(request);
  if (!resolved.user || !resolved.session) {
    return unauthorized(resolved.error || "Unauthorized");
  }

  return {
    user: resolved.user,
    session: resolved.session,
    response: null as NextResponse | null
  };
}
