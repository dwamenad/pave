import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";
import { getPlaceDetails } from "@/lib/server/place-service";

export async function GET(request: NextRequest, { params }: { params: { placeId: string } }) {
  const limited = await rateLimit(request);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterMs: limited.retryAfterMs },
      { status: 429 }
    );
  }

  const result = await getPlaceDetails(params.placeId);
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
}
