import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateAnonymousSession } from "@/lib/server/session";

type EventInput = {
  name?: unknown;
  props?: unknown;
  sessionId?: unknown;
};

function toSerializableProps(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const rawEvents = Array.isArray(body.events) ? (body.events as EventInput[]) : [];

  if (!rawEvents.length) {
    return NextResponse.json({ error: "events array is required" }, { status: 400 });
  }

  if (rawEvents.length > 100) {
    return NextResponse.json({ error: "Maximum batch size is 100 events" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const anonSession = user ? null : await getOrCreateAnonymousSession();

  const rows = rawEvents
    .map((event) => {
      const name = typeof event.name === "string" ? event.name.trim().toLowerCase().slice(0, 60) : "";
      if (!name) return null;

      return {
        name,
        userId: user?.id ?? null,
        anonSessionId: anonSession?.id ?? null,
        sessionId:
          typeof event.sessionId === "string"
            ? event.sessionId.slice(0, 120)
            : anonSession?.token ?? null,
        props: toSerializableProps(event.props)
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (!rows.length) {
    return NextResponse.json({ error: "No valid events in batch" }, { status: 400 });
  }

  const created = await db.event.createMany({
    data: rows
  });

  return NextResponse.json({ accepted: created.count });
}
