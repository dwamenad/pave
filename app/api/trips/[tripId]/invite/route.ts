import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
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

  return NextResponse.json({
    token,
    url: `${env.NEXT_PUBLIC_APP_URL}/trip/${trip.slug}?group=${token}`
  });
}
