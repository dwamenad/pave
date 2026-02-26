import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByUsername } from "@/lib/server/social-service";
import { PostFeedCard } from "@/components/post-feed-card";

export const dynamic = "force-dynamic";
export default async function ProfilePage({ params }: { params: { username: string } }) {
  const profile = await getPostsByUsername(params.username);
  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link href="/feed" className="text-sm text-primary underline">Back to feed</Link>
      <header>
        <h1 className="text-2xl font-bold">@{profile.user.username || profile.user.name || "traveler"}</h1>
        <p className="text-sm text-muted-foreground">Published itineraries</p>
      </header>

      {profile.posts.length ? (
        <div className="space-y-3">
          {profile.posts.map((post) => (
            <PostFeedCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="rounded border bg-white p-4 text-sm text-muted-foreground">No posts yet.</p>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Saved itineraries</h2>
        {profile.savedPosts.length ? (
          <div className="space-y-3">
            {profile.savedPosts.map((post) => (
              <PostFeedCard key={`saved-${post.id}`} post={post} />
            ))}
          </div>
        ) : (
          <p className="rounded border bg-white p-4 text-sm text-muted-foreground">No saved posts yet.</p>
        )}
      </section>
    </div>
  );
}
