import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

const COOKIE_NAME = "oca_session";

export async function getOrCreateSessionToken() {
  const cookieStore = cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) {
    await db.anonymousSession.upsert({
      where: { token: existing },
      update: { lastSeenAt: new Date() },
      create: { token: existing }
    });
    return existing;
  }

  const token = nanoid(24);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });

  await db.anonymousSession.create({ data: { token } });
  return token;
}
