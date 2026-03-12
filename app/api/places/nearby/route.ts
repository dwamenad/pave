import { NextRequest, NextResponse } from "next/server";
import { budgetToPriceRange } from "@/lib/itinerary";
import { captureServerException } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
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

  const limited = await enforceRateLimit(request, { policy: "provider_lookup" });
  if (limited) return limited;

  const price = budgetToPriceRange(budget);

  try {
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
  } catch (error) {
    await captureServerException(error, {
      route: "/api/places/nearby",
      subsystem: "nearby",
      provider: "google_places"
    });
    return NextResponse.json(
      {
        places: [],
        degraded: true,
        stale: false,
        reasonCode: "provider_unavailable",
        cacheState: "miss",
        fetchedAt: null,
        mockMode: false
      },
      { status: 500 }
    );
  }
}
