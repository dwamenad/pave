import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(request: NextRequest, { params }: { params: { commentId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  const comment = await db.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.authorId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.comment.update({ where: { id: comment.id }, data: { status: "DELETED" } });
  return NextResponse.json({ ok: true });
}
