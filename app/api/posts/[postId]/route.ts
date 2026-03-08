import { NextRequest, NextResponse } from "next/server";
import { trackEventWithActor } from "@/lib/server/events";
import { getApiActor } from "@/lib/server/route-user";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getPostDetail } from "@/lib/server/social-service";

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const actor = await getApiActor(request);
  const user = actor?.user ?? null;
  const sessionId = await getOrCreateSessionToken();
  const post = await getPostDetail(params.postId, user?.id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await trackEventWithActor({
    name: "view_post",
    userId: user?.id,
    sessionId,
    props: {
      postId: params.postId
    }
  });

  return NextResponse.json({ post });
}
