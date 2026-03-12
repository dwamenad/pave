import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackFeedAction } from "@/lib/server/events";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;
  const limited = await enforceRateLimit(request, { policy: "social_action", identifier: auth.user.id });
  if (limited) return limited;

  const existing = await db.postLike.findUnique({
    where: {
      postId_userId: {
        postId: params.postId,
        userId: auth.user.id
      }
    }
  });

  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
    await trackFeedAction({
      postId: params.postId,
      actionType: "unlike_post",
      userId: auth.user.id
    });
    return NextResponse.json({ liked: false });
  }

  await db.postLike.create({
    data: {
      postId: params.postId,
      userId: auth.user.id
    }
  });

  await trackFeedAction({
    postId: params.postId,
    actionType: "like_post",
    userId: auth.user.id
  });

  return NextResponse.json({ liked: true });
}
