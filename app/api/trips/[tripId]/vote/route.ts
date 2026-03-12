import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const body = await request.json();
  const placeId = String(body.placeId || "");
  const voteValue = Number(body.voteValue);
  const groupToken = String(body.groupToken || "");

  if (![1, -1].includes(voteValue)) {
    return NextResponse.json({ error: "voteValue must be 1 or -1" }, { status: 400 });
  }

  if (!groupToken) {
    return NextResponse.json({ error: "Group token is required for voting" }, { status: 400 });
  }
  const limited = await enforceRateLimit(request, { policy: "social_action", identifier: groupToken });
  if (limited) return limited;

  const invite = await db.groupInvite.findFirst({
    where: { tripId: params.tripId, token: groupToken }
  });
  if (!invite) {
    return NextResponse.json({ error: "Invalid group token" }, { status: 403 });
  }

  const token = groupToken;

  await db.vote.upsert({
    where: {
      tripId_tokenOrUserId_placeId: {
        tripId: params.tripId,
        tokenOrUserId: token,
        placeId
      }
    },
    update: { voteValue },
    create: {
      tripId: params.tripId,
      tokenOrUserId: token,
      placeId,
      voteValue
    }
  });

  return NextResponse.json({ ok: true });
}
