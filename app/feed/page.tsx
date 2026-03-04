import Link from "next/link";
import {
  Compass,
  Crown,
  Mountain,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  UserRoundCheck
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { buildTrendingDestinations, derivePlannerRole } from "@/lib/feed-view-model";
import { trackEventWithActor, trackFeedImpressions } from "@/lib/server/events";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getFeed } from "@/lib/server/social-service";
import type { FeedSource } from "@/lib/types";
import { FeedListClient } from "@/components/feed-list-client";
import { PillChip } from "@/components/social/pill-chip";
import { RailCard } from "@/components/social/rail-card";

export const dynamic = "force-dynamic";

function sourceFromQuery(source?: string): FeedSource {
  if (source === "following") return "FOLLOWING";
  if (source === "trending") return "TRENDING";
  return "FOR_YOU";
}

function sourceHref(source: FeedSource) {
  if (source === "FOLLOWING") return "/feed?source=following";
  if (source === "TRENDING") return "/feed?source=trending";
  return "/feed";
}

const categoryChips = [
  { label: "All Categories", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { label: "Adventure", icon: <Mountain className="h-3.5 w-3.5" /> },
  { label: "Luxury", icon: <Crown className="h-3.5 w-3.5" /> },
  { label: "Budget", icon: <PiggyBank className="h-3.5 w-3.5" /> },
  { label: "Solo", icon: <UserRound className="h-3.5 w-3.5" /> }
];

export default async function FeedPage({ searchParams }: { searchParams?: { source?: string } }) {
  const user = await getCurrentUser();
  const sessionId = await getOrCreateSessionToken();
  const source = sourceFromQuery(searchParams?.source);
  const feed = await getFeed({ source, userId: user?.id });

  await Promise.all([
    trackEventWithActor({
      name: "view_feed",
      userId: user?.id,
      sessionId,
      props: {
        source,
        itemCount: feed.items.length
      }
    }),
    trackFeedImpressions({
      postIds: feed.items.map((post) => post.id),
      source,
      userId: user?.id,
      sessionId
    })
  ]);

  const trending = buildTrendingDestinations(feed.items, 3);

  const creatorStats = new Map<
    string,
    {
      id: string;
      name: string;
      username?: string | null;
      image?: string | null;
      bio?: string | null;
      score: number;
    }
  >();

  for (const post of feed.items) {
    const current = creatorStats.get(post.author.id);
    const score = post.counts.likes + post.counts.comments + post.counts.saves;

    if (current) {
      creatorStats.set(post.author.id, {
        ...current,
        score: current.score + score
      });
      continue;
    }

    creatorStats.set(post.author.id, {
      id: post.author.id,
      name: post.author.name || post.author.username || "Traveler",
      username: post.author.username,
      image: post.author.image,
      bio: post.author.bio,
      score
    });
  }

  const creators = [...creatorStats.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((creator) => ({
      ...creator,
      role: derivePlannerRole({
        bio: creator.bio,
        score: creator.score,
        name: creator.name
      })
    }));

  return (
    <div className="social-shell">
      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="flex-1">
          <div className="mb-8">
            <h1 className="social-hero-title">Social Itinerary Feed</h1>
            <p className="social-hero-subtitle">Discover and remix community-crafted journeys from around the globe.</p>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {(["FOR_YOU", "FOLLOWING", "TRENDING"] as FeedSource[]).map((mode) => {
              const active = mode === source;
              return (
                <Link
                  key={mode}
                  className={
                    active
                      ? "inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                      : "inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
                  }
                  href={sourceHref(mode)}
                >
                  {mode === "FOR_YOU" ? "For You" : mode === "FOLLOWING" ? "Following" : "Trending"}
                </Link>
              );
            })}
          </div>

          <div className="social-chip-row mb-8">
            {categoryChips.map((chip, idx) => (
              <PillChip key={chip.label} active={idx === 0} icon={chip.icon} aria-label={`${chip.label} category`}>
                {chip.label}
              </PillChip>
            ))}
          </div>

          <FeedListClient initialItems={feed.items} initialNextCursor={feed.nextCursor} source={source} />
        </section>

        <aside className="social-rail">
          <RailCard title="Trending Now" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
            {trending.length ? (
              <ul className="space-y-4">
                {trending.map((entry) => (
                  <li key={entry.destination} className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {entry.thumbnailUrl ? (
                        <img alt={entry.destination} className="h-full w-full object-cover" src={entry.thumbnailUrl} />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-cyan-100 to-blue-100" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{entry.destination}</p>
                      <p className="text-xs text-slate-500">{entry.count} itineraries this week</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No trending destinations yet.</p>
            )}

            <button
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20"
              type="button"
            >
              View All Trends
            </button>
          </RailCard>

          <RailCard title="Top Planners" icon={<UserRoundCheck className="h-4 w-4 text-primary" />}>
            {creators.length ? (
              <ul className="space-y-4">
                {creators.map((creator) => (
                  <li key={creator.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        {creator.image ? <img alt={creator.name} className="h-full w-full object-cover" src={creator.image} /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{creator.name}</p>
                        <p className="text-xs text-slate-500">{creator.role}</p>
                      </div>
                    </div>

                    {creator.username ? (
                      <Link className="text-sm font-bold text-primary hover:underline" href={`/profile/${creator.username}`}>
                        Follow
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-slate-300">Follow</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Top planners appear as engagement grows.</p>
            )}
          </RailCard>

          <section className="overflow-hidden rounded-2xl bg-primary p-6 text-center text-white shadow-sm">
            <Rocket className="mx-auto mb-4 h-8 w-8" />
            <h3 className="text-2xl font-bold">Build Your Own</h3>
            <p className="mt-2 text-sm text-white/85">Create, share, and get remixed by the community!</p>
            <Link
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-extrabold text-primary hover:bg-slate-50"
              href="/create"
            >
              Start Planning
            </Link>
          </section>

          <RailCard title="Safety" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
            <p className="text-xs text-slate-500">
              Report harmful posts in detail view. Blocked users are hidden from your feed.
            </p>
          </RailCard>
        </aside>
      </div>

      <div className="flex justify-end">
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          href="/create"
        >
          <Compass className="h-4 w-4" />
          Create itinerary post
        </Link>
      </div>
    </div>
  );
}
