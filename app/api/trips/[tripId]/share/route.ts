import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { trackEventWithActor } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const trip = await db.trip.findUnique({ where: { id: params.tripId } });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const channel = typeof body.channel === "string" ? body.channel.slice(0, 40) : "direct";
  const actor = await getApiActor(request);
  const user = actor?.user ?? null;
  const token = nanoid(12);
  const deepLinkBase = env.DEEP_LINK_BASE_URL.replace(/\/+$/, "");
  const shareUrl = `${deepLinkBase}/trip/${trip.slug}?st=${token}`;

  const attribution = await db.shareAttribution.create({
    data: {
      token,
      tripId: trip.id,
      inviterId: user?.id ?? null,
      channel,
      destination: trip.title
    }
  });

  await trackEventWithActor({
    name: "share_trip",
    userId: user?.id,
    sessionId: token,
    props: {
      tripId: trip.id,
      shareAttributionId: attribution.id,
      channel
    }
  });

  return NextResponse.json({
    url: shareUrl,
    token,
    deepLinks: {
      web: shareUrl,
      ios: shareUrl,
      android: shareUrl
    }
  });
}
