import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { trackEventWithActor } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const actor = await getApiActor(request);
  const trip = await db.trip.findUnique({ where: { id: params.tripId } });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const token = nanoid(16);
  await db.groupInvite.create({
    data: {
      tripId: params.tripId,
      token
    }
  });

  await trackEventWithActor({
    name: "invite_collaborator",
    userId: actor?.user?.id ?? null,
    props: {
      tripId: params.tripId
    }
  });

  return NextResponse.json({
    token,
    url: `${env.NEXT_PUBLIC_APP_URL}/trip/${trip.slug}?group=${token}`
  });
}
