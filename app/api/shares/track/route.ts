import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { trackEventWithActor } from "@/lib/server/events";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const user = await getCurrentUser();

  const channel = typeof body.channel === "string" ? body.channel.slice(0, 40) : "direct";
  const token = typeof body.token === "string" && body.token.trim() ? body.token.trim() : nanoid(12);
  const tripId = typeof body.tripId === "string" ? body.tripId : null;
  const postId = typeof body.postId === "string" ? body.postId : null;
  const inviterId = user?.id ?? null;
  const destination = typeof body.destination === "string" ? body.destination.slice(0, 120) : null;
  const markOpened = body.markOpened === true;

  const attribution = await db.shareAttribution.upsert({
    where: {
      token
    },
    update: {
      channel,
      destination,
      openedAt: markOpened ? new Date() : undefined
    },
    create: {
      token,
      channel,
      destination,
      tripId,
      postId,
      inviterId,
      openedAt: markOpened ? new Date() : null
    }
  });

  await trackEventWithActor({
    name: "share_trip",
    userId: user?.id,
    sessionId: token,
    props: {
      shareAttributionId: attribution.id,
      channel,
      tripId,
      postId,
      opened: markOpened
    }
  });

  return NextResponse.json({
    token: attribution.token,
    shareAttributionId: attribution.id,
    openedAt: attribution.openedAt?.toISOString() ?? null
  });
}
