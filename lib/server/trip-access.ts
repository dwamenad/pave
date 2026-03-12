import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";

export async function requireTripAuthor(request: NextRequest, tripId: string) {
  const auth = await requireApiUser(request);
  if (!auth.user) {
    return { user: null, trip: null, response: auth.response ?? NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 }) };
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { id: true, slug: true, authorId: true, title: true }
  });

  if (!trip) {
    return {
      user: auth.user,
      trip: null,
      response: NextResponse.json({ error: "Trip not found", code: "trip_not_found" }, { status: 404 })
    };
  }

  if (!trip.authorId || trip.authorId !== auth.user.id) {
    return {
      user: auth.user,
      trip,
      response: NextResponse.json({ error: "Forbidden", code: "forbidden" }, { status: 403 })
    };
  }

  return { user: auth.user, trip, response: null };
}
