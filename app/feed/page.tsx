import Link from "next/link";
import { getFeed } from "@/lib/server/social-service";
import { PostFeedCard } from "@/components/post-feed-card";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const feed = await getFeed();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Social Feed</h1>
        <Link href="/create" className="rounded border px-3 py-2 text-sm hover:bg-muted">Create itinerary post</Link>
      </div>

      {feed.items.length ? (
        <div className="space-y-3">
          {feed.items.map((post) => (
            <PostFeedCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="rounded border bg-white p-4 text-sm text-muted-foreground">No posts yet. Be the first to publish one.</p>
      )}
    </div>
  );
}
