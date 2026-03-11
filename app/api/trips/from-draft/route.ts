import type { CreateTripFromDraftRequest } from "@pave/contracts";
import { NextRequest, NextResponse } from "next/server";
import { createTripFromDraftSchema } from "@/lib/server/ai/schema";
import { trackEvent } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";
import { createTripFromDraft, findDuplicateDraftPlaceIds, getDraftPlaceIds } from "@/lib/server/trip-service";

export async function POST(request: NextRequest) {
  const payload = createTripFromDraftSchema.parse((await request.json()) as CreateTripFromDraftRequest);
  const actor = await getApiActor(request);

  if (payload.draft.days.length !== payload.preferences.days) {
    return NextResponse.json({ error: "Draft day count no longer matches the selected preferences." }, { status: 400 });
  }

  const duplicates = findDuplicateDraftPlaceIds(payload.draft);
  if (duplicates.length) {
    return NextResponse.json({ error: "Draft contains duplicate places and cannot be saved.", duplicates }, { status: 400 });
  }

  const stayCount = payload.draft.days.flatMap((day) => day.items).filter((item) => item.category === "stay").length;
  if (stayCount > 1) {
    return NextResponse.json({ error: "Draft includes more than one stay recommendation." }, { status: 400 });
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
      dayCount: payload.draft.days.length,
      itemCount: getDraftPlaceIds(payload.draft).length,
      signedIn: Boolean(actor?.user)
    }
  });

  return NextResponse.json({ trip });
}
