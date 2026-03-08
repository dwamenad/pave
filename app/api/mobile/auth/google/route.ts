import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import type { MobileAuthGoogleRequest, MobileAuthResponse } from "@pave/contracts";
import { db } from "@/lib/db";
import { issueMobileSession } from "@/lib/server/mobile-auth-service";
import { verifyGoogleIdTokenForMobile } from "@/lib/server/mobile-google-id";

function safeUsernameSeed(email: string) {
  return email
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

async function createUniqueUsername(email: string) {
  const base = safeUsernameSeed(email) || "pave_user";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${base}_${nanoid(5).toLowerCase()}`;
    const existing = await db.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }
  return `${base}_${Date.now().toString().slice(-6)}`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as MobileAuthGoogleRequest | null;
  if (!body?.idToken || !body.platform) {
    return NextResponse.json({ error: "idToken and platform are required" }, { status: 400 });
  }

  try {
    const identity = await verifyGoogleIdTokenForMobile({
      idToken: body.idToken,
      platform: body.platform
    });

    if (!identity.email) {
      return NextResponse.json({ error: "Google account email is required" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: identity.email } });
    const username = existing?.username || (await createUniqueUsername(identity.email));

    const user = await db.user.upsert({
      where: { email: identity.email },
      update: {
        name: identity.name,
        image: identity.picture,
        username
      },
      create: {
        email: identity.email,
        name: identity.name,
        image: identity.picture,
        username
      }
    });

    const auth = await issueMobileSession({ userId: user.id });
    const payload: MobileAuthResponse = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresInSeconds: auth.expiresInSeconds,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image
      }
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mobile Google auth failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
