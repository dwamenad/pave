import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackEventWithActor, trackFeedAction } from "@/lib/server/events";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  const existing = await db.postSave.findUnique({
    where: {
      postId_userId: {
        postId: params.postId,
        userId: auth.user.id
      }
    }
  });

  if (existing) {
    await db.postSave.delete({ where: { id: existing.id } });
    await trackFeedAction({
      postId: params.postId,
      actionType: "unsave_post",
      userId: auth.user.id
    });
    return NextResponse.json({ saved: false });
  }

  await db.postSave.create({
    data: {
      postId: params.postId,
      userId: auth.user.id
    }
  });

  await Promise.all([
    trackFeedAction({
      postId: params.postId,
      actionType: "save_post",
      userId: auth.user.id
    }),
    trackEventWithActor({
      name: "save_post",
      userId: auth.user.id,
      props: {
        postId: params.postId
      }
    })
  ]);

  return NextResponse.json({ saved: true });
}
