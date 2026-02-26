import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";
import { containsProfanity } from "@/lib/server/moderation";

export async function GET(_: NextRequest, { params }: { params: { postId: string } }) {
  const comments = await db.comment.findMany({
    where: {
      postId: params.postId,
      status: "ACTIVE"
    },
    include: {
      author: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

  const body = await request.json();
  const text = String(body.body || "").trim().slice(0, 500);

  if (!text) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const status = containsProfanity(text) ? "HIDDEN" : "ACTIVE";

  const comment = await db.comment.create({
    data: {
      postId: params.postId,
      authorId: auth.user.id,
      body: text,
      status
    }
  });

  return NextResponse.json({ comment });
}
