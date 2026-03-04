import Link from "next/link";
import { Compass, Rocket, TrendingUp, UserRoundCheck } from "lucide-react";
import { getFeed } from "@/lib/server/social-service";
import { PostFeedCard } from "@/components/post-feed-card";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const feed = await getFeed();
  const trendCounts = new Map<string, number>();
  const creatorStats = new Map<string, { name: string; username?: string | null; score: number }>();

  for (const post of feed.items) {
    const destination = post.destinationLabel || post.trip.title;
    trendCounts.set(destination, (trendCounts.get(destination) || 0) + 1);
    const current = creatorStats.get(post.author.id);
    const score = post.counts.likes + post.counts.comments + post.counts.saves;
    if (current) {
      creatorStats.set(post.author.id, { ...current, score: current.score + score });
    } else {
      creatorStats.set(post.author.id, {
        name: post.author.name || post.author.username || "Traveler",
        username: post.author.username,
        score
      });
    }
  }

  const trending = [...trendCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const creators = [...creatorStats.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Social Itinerary Feed</h1>
          <p className="mt-2 text-base text-muted-foreground">Discover and remix community-crafted journeys from around the globe.</p>
        </div>
        <Link href="/create" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          <Compass className="h-4 w-4" />
          Create itinerary post
        </Link>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="flex-1 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", "Adventure", "Luxury", "Budget", "Solo"].map((chip, idx) => (
              <button
                key={chip}
                className={
                  idx === 0
                    ? "rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                    : "rounded-full border bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
                }
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>

          {feed.items.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {feed.items.map((post) => (
                <PostFeedCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="surface-card p-6 text-sm text-muted-foreground">No posts yet. Publish your first itinerary to start the feed.</div>
          )}

          {feed.nextCursor ? (
            <div className="flex justify-center">
              <button className="rounded-lg border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10" type="button">
                Load More Trips
              </button>
            </div>
          ) : null}
        </section>

        <aside className="w-full space-y-6 lg:w-80">
          <section className="surface-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Trending Now</h2>
            </div>
            {trending.length ? (
              <ul className="space-y-3">
                {trending.map(([destination, count]) => (
                  <li key={destination} className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{destination}</p>
                    <p className="text-xs text-muted-foreground">{count} itineraries in this feed</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No trending destinations yet.</p>
            )}
          </section>

          <section className="surface-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserRoundCheck className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Top Planners</h2>
            </div>
            {creators.length ? (
              <ul className="space-y-3">
                {creators.map((creator) => (
                  <li key={`${creator.username || creator.name}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">Engagement score: {creator.score}</p>
                    </div>
                    {creator.username ? (
                      <Link className="text-xs font-semibold text-primary hover:underline" href={`/profile/${creator.username}`}>
                        View
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Top planners will show up when posts are published.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-xl bg-primary p-5 text-white shadow-sm">
            <Rocket className="mb-3 h-6 w-6" />
            <h3 className="text-lg font-bold">Build Your Own</h3>
            <p className="mt-1 text-sm text-white/90">Create a trip from social inspiration and publish it to the community feed.</p>
            <Link
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-slate-100"
              href="/create"
            >
              Start Planning
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
