import { NextRequest, NextResponse } from "next/server";
import { trackEventWithActor, trackFeedImpressions } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getForYouFeed } from "@/lib/server/social-service";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const actor = await getApiActor(request);
  const user = actor?.user ?? null;
  const sessionId = await getOrCreateSessionToken();
  const feed = await getForYouFeed(user?.id, cursor);

  await Promise.all([
    trackEventWithActor({
      name: "view_feed",
      userId: user?.id,
      sessionId,
      props: {
        source: "FOR_YOU",
        itemCount: feed.items.length
      }
    }),
    trackFeedImpressions({
      postIds: feed.items.map((post) => post.id),
      source: "FOR_YOU",
      userId: user?.id,
      sessionId
    })
  ]);

  return NextResponse.json(feed);
}
