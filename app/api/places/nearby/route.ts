import { NextRequest, NextResponse } from "next/server";
import { budgetToPriceRange } from "@/lib/itinerary";
import { searchNearbyPlaces } from "@/lib/server/place-service";
import type { BudgetMode } from "@/lib/types";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const type = request.nextUrl.searchParams.get("type") || "restaurant";
  const radiusMeters = Number(request.nextUrl.searchParams.get("radius") || 3000);
  const budget = (request.nextUrl.searchParams.get("budget") || "mid") as BudgetMode;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
  }

  const price = budgetToPriceRange(budget);

  const result = await searchNearbyPlaces({
    lat,
    lng,
    type,
    radiusMeters,
    ...price
  });

  return NextResponse.json({
    places: result.data ?? [],
    degraded: result.degraded,
    stale: result.stale,
    reasonCode: result.reasonCode,
    cacheState: result.cacheState,
    fetchedAt: result.fetchedAt,
    mockMode: result.mockMode
  });
}
