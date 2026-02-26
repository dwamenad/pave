import { NextRequest, NextResponse } from "next/server";
import { placesProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/server/rate-limit";

function toClientError(error: unknown) {
  const message = error instanceof Error ? error.message : "Autocomplete failed";
  if (message.includes("Missing GOOGLE_MAPS_API_KEY_SERVER")) {
    return "Google Places server key is missing.";
  }
  if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
    return "Google Places server key is invalid.";
  }
  return "Unable to load place suggestions right now.";
}

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const query = request.nextUrl.searchParams.get("q") || "";
    const sessionToken = request.nextUrl.searchParams.get("sessionToken") || undefined;

    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await placesProvider.autocomplete(query, sessionToken);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: toClientError(error), suggestions: [] },
      { status: 500 }
    );
  }
}
