import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/server/social-service";

export async function GET(_: NextRequest, { params }: { params: { postId: string } }) {
  const user = await getCurrentUser();
  const post = await getPostDetail(params.postId, user?.id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}
