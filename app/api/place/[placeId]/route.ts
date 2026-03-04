import { NextRequest, NextResponse } from "next/server";
import { placesProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest, { params }: { params: { placeId: string } }) {
  const limited = await rateLimit(request);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterMs: limited.retryAfterMs },
      { status: 429 }
    );
  }

  const place = await placesProvider.placeDetails(params.placeId);
  return NextResponse.json({ place });
}
