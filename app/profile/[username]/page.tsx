import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bookmark, CalendarDays, MapPin, Rss, Sparkles } from "lucide-react";
import { getPostsByUsername } from "@/lib/server/social-service";
import { PostFeedCard } from "@/components/post-feed-card";
import { getCurrentUser } from "@/lib/auth";
import { FollowButton } from "@/components/follow-button";
import { StatTile } from "@/components/social/stat-tile";
import { normalizeProfileTab } from "@/lib/profile-view-model";
import { SectionHeader } from "@/components/social/section-header";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams?: { tab?: string };
}) {
  const viewer = await getCurrentUser();
  const profile = await getPostsByUsername(params.username, viewer?.id);
  if (!profile) {
    notFound();
  }

  const displayName = profile.user.name || profile.user.username || "Traveler";
  const activeTab = normalizeProfileTab(searchParams?.tab);

  const activeItems = activeTab === "saved" ? profile.savedPosts : profile.posts;
  const totalPlannedDays = profile.posts.reduce((sum, post) => sum + Math.max(1, post.trip.daysCount), 0);
  const joinedLabel = profile.user.createdAt ? new Date(profile.user.createdAt).toLocaleDateString() : "Joined recently";

  return (
    <div className="space-y-8">
      <Link href="/feed" className="text-sm font-semibold text-primary hover:underline">
        Back to feed
      </Link>

      <section className="social-card relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-sky-100/80 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-20 h-52 w-52 rounded-full bg-cyan-100/80 blur-2xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-start md:text-left">
            {profile.user.image ? (
              <img alt={displayName} className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-sm" src={profile.user.image} />
            ) : (
              <div className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-primary/15">
                <Rss className="h-8 w-8 text-primary" />
              </div>
            )}

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">@{profile.user.username || "traveler"}</p>
              {profile.user.bio ? <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{profile.user.bio}</p> : null}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground md:justify-start">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {joinedLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Public traveler profile
                </span>
              </div>
            </div>
          </div>

          {viewer?.id && viewer.id !== profile.user.id && !profile.viewerBlocked ? (
            <FollowButton userId={profile.user.id} initiallyFollowing={profile.viewerFollows} />
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Trips Created" value={profile.posts.length} />
          <StatTile label="Saved Trips" value={profile.savedPosts.length} />
          <StatTile label="Planned Days" value={totalPlannedDays} />
          <StatTile label="Role" value={profile.user.bio ? "Community Creator" : "Trip Curator"} className="[&>p:last-child]:text-xl" />
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title={activeTab === "saved" ? "Saved Itineraries" : "Published Posts"}
          subtitle={activeTab === "saved" ? "Trips this profile wants to revisit." : "What this creator has shared with the community."}
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          action={
            activeItems.length ? (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{activeItems.length} cards</span>
            ) : null
          }
        />

        <div className="sticky top-[4.75rem] z-30 -mx-1 rounded-xl bg-background/95 px-1 backdrop-blur">
          <div className="flex items-center gap-6 border-b border-border px-2">
            <Link
              href={`/profile/${params.username}?tab=posts`}
              className={
                activeTab === "posts"
                  ? "inline-flex items-center gap-2 border-b-[3px] border-primary py-3 text-sm font-bold text-foreground"
                  : "inline-flex items-center gap-2 border-b-[3px] border-transparent py-3 text-sm font-bold text-muted-foreground hover:text-foreground"
              }
            >
              <Rss className="h-4 w-4" />
              My Posts
            </Link>
            <Link
              href={`/profile/${params.username}?tab=saved`}
              className={
                activeTab === "saved"
                  ? "inline-flex items-center gap-2 border-b-[3px] border-primary py-3 text-sm font-bold text-foreground"
                  : "inline-flex items-center gap-2 border-b-[3px] border-transparent py-3 text-sm font-bold text-muted-foreground hover:text-foreground"
              }
            >
              <Bookmark className="h-4 w-4" />
              Saved
            </Link>
          </div>
        </div>

        {activeItems.length ? (
          <div className="social-feed-grid">
            {activeItems.map((post) => (
              <PostFeedCard key={`${activeTab}-${post.id}`} post={post} />
            ))}
          </div>
        ) : (
          <div className="social-empty-panel space-y-3">
            <p>{activeTab === "saved" ? "No saved posts yet." : "No published posts yet."}</p>
            <Link
              href={activeTab === "saved" ? "/feed" : "/create"}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-primary px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              {activeTab === "saved" ? "Browse feed" : "Create first post"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
