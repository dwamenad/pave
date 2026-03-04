import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

const COOKIE_NAME = "oca_session";

export function getSessionTokenFromRequest() {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value || nanoid(24);
}

export async function getOrCreateAnonymousSession() {
  const cookieStore = cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) {
    return db.anonymousSession.upsert({
      where: { token: existing },
      update: { lastSeenAt: new Date() },
      create: { token: existing }
    });
  }

  const token = nanoid(24);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });

  return db.anonymousSession.create({ data: { token } });
}

export async function getOrCreateSessionToken() {
  const session = await getOrCreateAnonymousSession();
  return session.token;
}
