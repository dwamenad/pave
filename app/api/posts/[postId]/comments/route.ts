import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";
import { containsProfanity } from "@/lib/server/moderation";

function mapComment(comment: {
  id: string;
  body: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  createdAt: Date;
  author: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
  };
}) {
  return {
    id: comment.id,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      username: comment.author.username,
      name: comment.author.name,
      image: comment.author.image
    }
  };
}

export async function GET(_: NextRequest, { params }: { params: { postId: string } }) {
  const comments = await db.comment.findMany({
    where: {
      postId: params.postId,
      status: "ACTIVE"
    },
    select: {
      id: true,
      body: true,
      status: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ comments: comments.map(mapComment) });
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
    },
    select: {
      id: true,
      body: true,
      status: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true
        }
      }
    }
  });

  return NextResponse.json({ comment: mapComment(comment) });
}
