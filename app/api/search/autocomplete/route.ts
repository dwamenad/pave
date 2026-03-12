import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";
import { autocompletePlaces } from "@/lib/server/place-service";

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
    const limited = await rateLimit(request);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests", retryAfterMs: limited.retryAfterMs },
        { status: 429 }
      );
    }

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
  } catch {
    return NextResponse.json(
      { error: "Unable to load place suggestions right now.", code: "provider_unavailable", suggestions: [] },
      { status: 500 }
    );
  }
}
