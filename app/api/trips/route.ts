import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTripPlan } from "@/lib/server/trip-service";
import { getCurrentUser } from "@/lib/auth";

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
  const payload = createTripSchema.parse(await request.json());
  const user = await getCurrentUser();
  const trip = await generateTripPlan({
    ...payload,
    authorId: user?.id
  });
  return NextResponse.json({ trip });
}
