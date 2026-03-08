import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  if (auth.user.id === params.userId) {
    return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true }
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await db.$transaction([
    db.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: auth.user.id,
          blockedId: targetUser.id
        }
      },
      update: {},
      create: {
        blockerId: auth.user.id,
        blockedId: targetUser.id
      }
    }),
    db.follow.deleteMany({
      where: {
        OR: [
          { followerId: auth.user.id, followeeId: targetUser.id },
          { followerId: targetUser.id, followeeId: auth.user.id }
        ]
      }
    })
  ]);

  return NextResponse.json({ blocked: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  await db.block.deleteMany({
    where: {
      blockerId: auth.user.id,
      blockedId: params.userId
    }
  });

  return NextResponse.json({ blocked: false });
}
