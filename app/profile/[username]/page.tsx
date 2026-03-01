import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, CalendarDays, MapPin, Rss } from "lucide-react";
import { getPostsByUsername } from "@/lib/server/social-service";
import { PostFeedCard } from "@/components/post-feed-card";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function ProfilePage({ params }: { params: { username: string } }) {
  const viewer = await getCurrentUser();
  const profile = await getPostsByUsername(params.username, viewer?.id);
  if (!profile) {
    notFound();
  }

  const displayName = profile.user.name || profile.user.username || "Traveler";

  return (
    <div className="space-y-8">
      <Link href="/feed" className="text-sm font-semibold text-primary hover:underline">Back to feed</Link>

      <section className="surface-card p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {profile.user.image ? (
              <img alt={displayName} className="h-20 w-20 rounded-full border object-cover" src={profile.user.image} />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/15" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">@{profile.user.username || "traveler"}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined One Click Away
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Public traveler profile
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Posts</p>
            <p className="text-2xl font-bold text-primary">{profile.posts.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Saved</p>
            <p className="text-2xl font-bold text-primary">{profile.savedPosts.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Visibility</p>
            <p className="text-sm font-semibold">Public profile</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="text-sm font-semibold">Trip curator</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">My Posts</h2>
        </div>
        {profile.posts.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {profile.posts.map((post) => (
              <PostFeedCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="surface-card p-4 text-sm text-muted-foreground">No published posts yet.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">Saved Trips</h2>
        </div>
        {profile.savedPosts.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {profile.savedPosts.map((post) => (
              <PostFeedCard key={`saved-${post.id}`} post={post} />
            ))}
          </div>
        ) : (
          <p className="surface-card p-4 text-sm text-muted-foreground">No saved posts yet.</p>
        )}
      </section>
    </div>
  );
}
