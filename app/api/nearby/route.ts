import { NextRequest, NextResponse } from "next/server";
import { budgetToPriceRange } from "@/lib/itinerary";
import { captureServerException } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { searchNearbyPlaces } from "@/lib/server/place-service";

const quickTypes = {
  eat: ["restaurant"],
  coffee: ["cafe"],
  do: ["tourist_attraction", "park"]
};

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, { policy: "provider_lookup" });
  if (limited) return limited;

  const price = budgetToPriceRange("mid");

  try {
    const [eat, coffee, quickDo] = await Promise.all([
      searchNearbyPlaces({ lat, lng, type: quickTypes.eat[0], radiusMeters: 2000, ...price }),
      searchNearbyPlaces({ lat, lng, type: quickTypes.coffee[0], radiusMeters: 2000, ...price }),
      searchNearbyPlaces({ lat, lng, type: quickTypes.do[0], radiusMeters: 2500, ...price })
    ]);

    const degraded = eat.degraded || coffee.degraded || quickDo.degraded;
    const stale = eat.stale || coffee.stale || quickDo.stale;
    const reasonCode = eat.reasonCode || coffee.reasonCode || quickDo.reasonCode;
    const cacheState = [eat.cacheState, coffee.cacheState, quickDo.cacheState].includes("hit")
      ? "hit"
      : stale
        ? "stale"
        : "miss";

    return NextResponse.json({
      eat: (eat.data ?? []).slice(0, 5),
      coffee: (coffee.data ?? []).slice(0, 5),
      do: (quickDo.data ?? []).slice(0, 5),
      degraded,
      stale,
      reasonCode,
      cacheState,
      mockMode: eat.mockMode || coffee.mockMode || quickDo.mockMode
    });
  } catch (error) {
    await captureServerException(error, {
      route: "/api/nearby",
      subsystem: "nearby",
      provider: "google_places"
    });
    return NextResponse.json({
      eat: [],
      coffee: [],
      do: [],
      degraded: true,
      stale: false,
      reasonCode: "provider_unavailable",
      cacheState: "miss",
      mockMode: false
    });
  }
}
