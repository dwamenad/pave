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
  const itemId: string = body.itemId;

  const item = await db.tripItem.findFirst({
    where: {
      id: itemId,
      tripDay: {
        tripId: params.tripId
      }
    }
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await db.tripItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
