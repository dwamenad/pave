import type { AiTripDraftRequest } from "@pave/contracts";
import { NextRequest, NextResponse } from "next/server";
import { generateAiTripDraft } from "@/lib/server/ai/draft";
import { aiTripDraftRequestSchema } from "@/lib/server/ai/schema";
import { trackEvent } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";

function countDraftItems(days: Array<{ items: unknown[] }>) {
  return days.reduce((total, day) => total + day.items.length, 0);
}

export async function POST(request: NextRequest) {
  const payload = aiTripDraftRequestSchema.parse((await request.json()) as AiTripDraftRequest);
  const actor = await getApiActor(request);

  await trackEvent({
    name: "ai_draft_requested",
    userId: actor?.user?.id ?? null,
    props: {
      model: process.env.OPENAI_RESPONSES_MODEL || "gpt-4.1-mini",
      generationMode: "ai",
      fallbackReason: null,
      placeResolved: true,
      cacheState: "miss",
      requestedDays: payload.preferences.days,
      publishAfterCreate: null,
      signedIn: Boolean(actor?.user)
    }
  });

  const draftResponse = await generateAiTripDraft({
    request: payload,
    requesterUserId: actor?.user?.id ?? null
  });

  await trackEvent({
    name: draftResponse.generationMode === "fallback" ? "ai_draft_fallback" : "ai_draft_completed",
    userId: actor?.user?.id ?? null,
    props: {
      model: draftResponse.telemetry.model,
      latencyMs: draftResponse.telemetry.latencyMs,
      toolCount: draftResponse.telemetry.toolCount,
      retrievalUsed: draftResponse.telemetry.retrievalUsed,
      generationMode: draftResponse.generationMode,
      fallbackReason: draftResponse.fallbackReason ?? null,
      placeResolved: true,
      cacheState: draftResponse.provider?.cacheState ?? "miss",
      dayCount: draftResponse.draft.days.length,
      itemCount: countDraftItems(draftResponse.draft.days),
      publishAfterCreate: null,
      signedIn: draftResponse.telemetry.signedIn
    }
  });

  return NextResponse.json(draftResponse);
}
