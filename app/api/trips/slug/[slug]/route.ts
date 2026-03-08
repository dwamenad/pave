import { NextRequest, NextResponse } from "next/server";
import { getTripBySlug, getVoteTotals } from "@/lib/server/trip-service";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const trip = await getTripBySlug(params.slug);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const votes = await getVoteTotals(trip.id);
  return NextResponse.json({ trip, votes });
}
