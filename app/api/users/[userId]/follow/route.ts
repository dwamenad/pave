import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification, trackEvent } from "@/lib/server/events";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(_: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

  if (auth.user.id === params.userId) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true, username: true }
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: auth.user.id, blockedId: targetUser.id },
        { blockerId: targetUser.id, blockedId: auth.user.id }
      ]
    }
  });

  if (blocked) {
    return NextResponse.json({ error: "Cannot follow while blocked" }, { status: 403 });
  }

  await db.follow.upsert({
    where: {
      followerId_followeeId: {
        followerId: auth.user.id,
        followeeId: targetUser.id
      }
    },
    update: {},
    create: {
      followerId: auth.user.id,
      followeeId: targetUser.id
    }
  });

  await Promise.all([
    trackEvent({
      name: "follow_user",
      userId: auth.user.id,
      props: {
        followeeId: targetUser.id
      }
    }),
    createNotification({
      userId: targetUser.id,
      type: "FOLLOW",
      entityId: auth.user.id,
      payload: {
        followerId: auth.user.id,
        followerUsername: auth.user.username
      }
    })
  ]);

  return NextResponse.json({ following: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

  await db.follow.deleteMany({
    where: {
      followerId: auth.user.id,
      followeeId: params.userId
    }
  });

  return NextResponse.json({ following: false });
}
