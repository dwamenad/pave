import type { CreateTripFromDraftRequest } from "@pave/contracts";
import { NextRequest, NextResponse } from "next/server";
import { createTripFromDraftSchema } from "@/lib/server/ai/schema";
import { trackEvent } from "@/lib/server/events";
import { captureServerException, jsonError } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getApiActor } from "@/lib/server/route-user";
import {
  CreateTripFromDraftError,
  createTripFromDraft,
  findDuplicateDraftPlaceIds,
  getDraftPlaceIds
} from "@/lib/server/trip-service";

export async function POST(request: NextRequest) {
  const actor = await getApiActor(request);
  const limited = await enforceRateLimit(request, {
    policy: "user_content",
    identifier: actor?.user?.id ?? undefined
  });
  if (limited) return limited;

  try {
    const payload = createTripFromDraftSchema.parse((await request.json()) as CreateTripFromDraftRequest);

    if (payload.draft.days.length !== payload.preferences.days) {
      return NextResponse.json(
        { error: "Draft day count no longer matches the selected preferences.", code: "draft_day_mismatch" },
        { status: 400 }
      );
    }

    const duplicates = findDuplicateDraftPlaceIds(payload.draft);
    if (duplicates.length) {
      return NextResponse.json(
        { error: "Draft contains duplicate places and cannot be saved.", code: "duplicate_places", duplicates },
        { status: 400 }
      );
    }

    const stayCount = payload.draft.days.flatMap((day) => day.items).filter((item) => item.category === "stay").length;
    if (stayCount > 1) {
      return NextResponse.json(
        { error: "Draft includes more than one stay recommendation.", code: "too_many_stays" },
        { status: 400 }
      );
    }

    const trip = await createTripFromDraft({
      draft: payload.draft,
      authorId: actor?.user?.id
    });

    await trackEvent({
      name: "ai_draft_accepted",
      userId: actor?.user?.id ?? null,
      props: {
        editedBeforeSave: payload.editedBeforeSave ?? false,
        generationMode: "ai",
        fallbackReason: null,
        placeResolved: true,
        cacheState: "miss",
        dayCount: payload.draft.days.length,
        itemCount: getDraftPlaceIds(payload.draft).length,
        publishAfterCreate: null,
        signedIn: Boolean(actor?.user)
      }
    });

    return NextResponse.json({ trip });
  } catch (error) {
    if (error instanceof CreateTripFromDraftError) {
      const status = error.code === "provider_unavailable" ? 503 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    await captureServerException(error, {
      route: "/api/trips/from-draft",
      subsystem: "planner",
      userId: actor?.user?.id ?? null,
      signedIn: Boolean(actor?.user),
      provider: "google_places"
    });
    return jsonError({
      error: "Unable to save this draft right now.",
      code: "provider_unavailable",
      status: 500
    });
  }
}
