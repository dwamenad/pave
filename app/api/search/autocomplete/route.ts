import { NextRequest, NextResponse } from "next/server";
import { captureServerException, jsonError } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { autocompletePlaces } from "@/lib/server/place-service";

export const dynamic = "force-dynamic";

function toClientError(code?: string) {
  if (code === "provider_misconfigured") {
    return "Google Places server key is missing.";
  }
  if (code === "invalid_request") {
    return "The place lookup request was invalid.";
  }
  if (code === "rate_limited") {
    return "Autocomplete is rate limited right now.";
  }
  return "Unable to load place suggestions right now.";
}

export async function GET(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(request, { policy: "provider_lookup" });
    if (limited) return limited;

    const query = request.nextUrl.searchParams.get("q") || "";
    const sessionToken = request.nextUrl.searchParams.get("sessionToken") || undefined;

    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = await autocompletePlaces(query, sessionToken);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: toClientError(result.reasonCode),
          code: result.reasonCode,
          suggestions: [],
          mockMode: result.mockMode
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      suggestions: result.data ?? [],
      code: result.reasonCode,
      mockMode: result.mockMode
    });
  } catch (error) {
    await captureServerException(error, {
      route: "/api/search/autocomplete",
      subsystem: "place_lookup",
      provider: "google_places"
    });
    return jsonError({
      error: "Unable to load place suggestions right now.",
      code: "provider_unavailable",
      status: 500,
      extras: { suggestions: [] }
    });
  }
}
