import { NextRequest, NextResponse } from "next/server";
import { trackEventWithActor, trackFeedImpressions } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getFeed } from "@/lib/server/social-service";
import type { FeedSource } from "@/lib/types";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const requestedSource = request.nextUrl.searchParams.get("source");
  const source: FeedSource =
    requestedSource === "FOLLOWING" || requestedSource === "TRENDING"
      ? requestedSource
      : "FOR_YOU";
  const actor = await getApiActor(request);
  const user = actor?.user ?? null;
  const sessionId = await getOrCreateSessionToken();
  const feed = await getFeed({ cursor, source, userId: user?.id });

  await Promise.all([
    trackEventWithActor({
      name: "view_feed",
      userId: user?.id,
      sessionId,
      props: {
        source,
        itemCount: feed.items.length
      }
    }),
    trackFeedImpressions({
      postIds: feed.items.map((post) => post.id),
      source,
      userId: user?.id,
      sessionId
    })
  ]);

  return NextResponse.json(feed);
}
