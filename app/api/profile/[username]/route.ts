import { NextRequest, NextResponse } from "next/server";
import { getApiActor } from "@/lib/server/route-user";
import { getPostsByUsername } from "@/lib/server/social-service";

function normalizeTab(input: string | null) {
  return input === "saved" ? "saved" : "posts";
}

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  const actor = await getApiActor(request);
  const viewer = actor?.user ?? null;
  const tab = normalizeTab(request.nextUrl.searchParams.get("tab"));

  const profile = await getPostsByUsername(params.username, viewer?.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const totalPlannedDays = profile.posts.reduce((sum, post) => sum + Math.max(1, post.trip.daysCount), 0);
  const items = tab === "saved" ? profile.savedPosts : profile.posts;

  return NextResponse.json({
    tab,
    user: {
      id: profile.user.id,
      email: profile.user.email,
      username: profile.user.username,
      name: profile.user.name,
      image: profile.user.image,
      bio: profile.user.bio,
      createdAt: profile.user.createdAt.toISOString(),
      stats: {
        posts: profile.posts.length,
        savedPosts: profile.savedPosts.length,
        totalPlannedDays
      }
    },
    posts: profile.posts,
    savedPosts: profile.savedPosts,
    items,
    viewer: {
      follows: profile.viewerFollows,
      blocked: profile.viewerBlocked
    }
  });
}
