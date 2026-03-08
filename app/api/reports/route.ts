import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;

  const body = await request.json();
  const targetType = body.targetType === "COMMENT" ? "COMMENT" : "POST";
  const targetId = String(body.targetId || "");
  const reason = String(body.reason || "").slice(0, 250);

  if (!targetId || !reason) {
    return NextResponse.json({ error: "targetId and reason are required" }, { status: 400 });
  }

  const report = await db.report.create({
    data: {
      targetType,
      targetId,
      reason,
      reporterId: auth.user.id,
      postId: targetType === "POST" ? targetId : null,
      commentId: targetType === "COMMENT" ? targetId : null
    }
  });

  if (targetType === "POST") {
    await db.post.update({ where: { id: targetId }, data: { status: "HIDDEN" } }).catch(() => null);
  }

  if (targetType === "COMMENT") {
    await db.comment.update({ where: { id: targetId }, data: { status: "HIDDEN" } }).catch(() => null);
  }

  return NextResponse.json({ report });
}
