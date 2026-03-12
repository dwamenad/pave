import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTripPlan } from "@/lib/server/trip-service";
import { captureServerException, jsonError } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getApiActor } from "@/lib/server/route-user";
import { CreateTripFromDraftError } from "@/lib/server/trip-service";

const createTripSchema = z.object({
  title: z.string().min(2),
  placeId: z.string().optional(),
  centerLat: z.number(),
  centerLng: z.number(),
  days: z.number().int().min(1).max(3),
  budget: z.enum(["budget", "mid", "luxury"]),
  preferences: z
    .object({
      budget: z.enum(["budget", "mid", "luxury"]),
      days: z.number().int().min(1).max(3),
      pace: z.enum(["slow", "balanced", "packed"]),
      vibeTags: z.array(z.string()).max(12),
      dietary: z.array(z.string()).max(8)
    })
    .optional()
});

export async function POST(request: NextRequest) {
  const actor = await getApiActor(request);
  const limited = await enforceRateLimit(request, {
    policy: "provider_lookup",
    identifier: actor?.user?.id ?? undefined
  });
  if (limited) return limited;

  try {
    const payload = createTripSchema.parse(await request.json());
    const user = actor?.user ?? null;
    const trip = await generateTripPlan({
      ...payload,
      authorId: user?.id
    });
    return NextResponse.json({ trip });
  } catch (error) {
    if (error instanceof CreateTripFromDraftError) {
      const status = error.code === "provider_unavailable" ? 503 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    await captureServerException(error, {
      route: "/api/trips",
      subsystem: "planner",
      userId: actor?.user?.id ?? null,
      signedIn: Boolean(actor?.user),
      provider: "google_places"
    });
    return jsonError({
      error: "Unable to generate a trip right now.",
      code: "provider_unavailable",
      status: 500
    });
  }
}
