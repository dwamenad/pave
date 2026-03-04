import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { trackEventWithActor } from "@/lib/server/events";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getPostDetail } from "@/lib/server/social-service";

export async function GET(_: NextRequest, { params }: { params: { postId: string } }) {
  const user = await getCurrentUser();
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
