import { NextRequest, NextResponse } from "next/server";
import { trackEventWithActor, trackFeedImpressions } from "@/lib/server/events";
import { requireApiUser } from "@/lib/server/route-user";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getFollowingFeed } from "@/lib/server/social-service";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const sessionId = await getOrCreateSessionToken();
  const feed = await getFollowingFeed(auth.user.id, cursor);

  await Promise.all([
    trackEventWithActor({
      name: "view_feed",
      userId: auth.user.id,
      sessionId,
      props: {
        source: "FOLLOWING",
        itemCount: feed.items.length
      }
    }),
    trackFeedImpressions({
      postIds: feed.items.map((post) => post.id),
      source: "FOLLOWING",
      userId: auth.user.id,
      sessionId
    })
  ]);

  return NextResponse.json(feed);
}
