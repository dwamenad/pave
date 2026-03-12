import type { CreateTripFromDraftRequest } from "@pave/contracts";
import { NextRequest, NextResponse } from "next/server";
import { createTripFromDraftSchema } from "@/lib/server/ai/schema";
import { trackEvent } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";
import {
  CreateTripFromDraftError,
  createTripFromDraft,
  findDuplicateDraftPlaceIds,
  getDraftPlaceIds
} from "@/lib/server/trip-service";

export async function POST(request: NextRequest) {
  const payload = createTripFromDraftSchema.parse((await request.json()) as CreateTripFromDraftRequest);
  const actor = await getApiActor(request);

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

  try {
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
    throw error;
  }
}
