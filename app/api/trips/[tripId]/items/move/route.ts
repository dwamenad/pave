import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireTripAuthor } from "@/lib/server/trip-access";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const access = await requireTripAuthor(request, params.tripId);
  if (!access.user || access.response) return access.response!;
  const limited = await enforceRateLimit(request, { policy: "user_content", identifier: access.user.id });
  if (limited) return limited;

  const body = await request.json();
  const { itemId, toDayId } = body as { itemId: string; toDayId: string };

  const toDay = await db.tripDay.findFirst({ where: { id: toDayId, tripId: params.tripId }, include: { items: true } });
  if (!toDay) {
    return NextResponse.json({ error: "Destination day not found" }, { status: 404 });
  }

  await db.tripItem.update({
    where: { id: itemId },
    data: {
      tripDayId: toDayId,
      orderIndex: toDay.items.length
    }
  });

  return NextResponse.json({ ok: true });
}
