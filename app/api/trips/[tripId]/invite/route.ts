import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { trackEventWithActor } from "@/lib/server/events";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireTripAuthor } from "@/lib/server/trip-access";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const access = await requireTripAuthor(request, params.tripId);
  if (!access.user || access.response) return access.response!;
  const limited = await enforceRateLimit(request, { policy: "user_content", identifier: access.user.id });
  if (limited) return limited;
  const trip = access.trip!;

  const token = nanoid(16);
  await db.groupInvite.create({
    data: {
      tripId: params.tripId,
      token
    }
  });

  await trackEventWithActor({
    name: "invite_collaborator",
    userId: access.user.id,
    props: {
      tripId: params.tripId
    }
  });

  return NextResponse.json({
    token,
    url: `${env.NEXT_PUBLIC_APP_URL}/trip/${trip.slug}?group=${token}`
  });
}
