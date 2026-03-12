import { NextRequest, NextResponse } from "next/server";
import { captureServerException } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getPlaceDetails } from "@/lib/server/place-service";

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, { policy: "provider_lookup" });
  if (limited) return limited;

  try {
    const result = await getPlaceDetails(placeId);
    if (!result.ok || !result.data) {
      const status = result.reasonCode === "no_results" ? 404 : 503;
      return NextResponse.json(
        { error: "Unable to load place details.", code: result.reasonCode, mockMode: result.mockMode },
        { status }
      );
    }

    return NextResponse.json({
      place: result.data,
      degraded: result.degraded,
      stale: result.stale,
      reasonCode: result.reasonCode,
      cacheState: result.cacheState,
      fetchedAt: result.fetchedAt,
      mockMode: result.mockMode
    });
  } catch (error) {
    await captureServerException(error, {
      route: "/api/places/details",
      subsystem: "place_lookup",
      provider: "google_places"
    });
    return NextResponse.json(
      { error: "Unable to load place details.", code: "provider_unavailable", mockMode: false },
      { status: 500 }
    );
  }
}
