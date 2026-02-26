import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(_: NextRequest, { params }: { params: { postId: string } }) {
  const auth = await requireApiUser();
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
    return NextResponse.json({ saved: false });
  }

  await db.postSave.create({
    data: {
      postId: params.postId,
      userId: auth.user.id
    }
  });

  return NextResponse.json({ saved: true });
}
