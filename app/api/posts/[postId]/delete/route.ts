import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  const post = await db.post.findUnique({ where: { id: params.postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.authorId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.post.update({ where: { id: post.id }, data: { status: "DELETED" } });
  return NextResponse.json({ ok: true });
}
