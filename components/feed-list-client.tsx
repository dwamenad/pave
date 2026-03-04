"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PostFeedCard } from "@/components/post-feed-card";
import type { FeedSource, PostSummary } from "@/lib/types";

type Props = {
  initialItems: PostSummary[];
  initialNextCursor: string | null;
  source: FeedSource;
};

function dedupePosts(items: PostSummary[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function FeedListClient({ initialItems, initialNextCursor, source }: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = useMemo(() => items.length > 0, [items]);

  async function loadMore() {
    if (!nextCursor || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/feed?source=${encodeURIComponent(source)}&cursor=${encodeURIComponent(nextCursor)}`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(`feed_fetch_${response.status}`);
      }

      const payload = (await response.json()) as {
        items?: PostSummary[];
        nextCursor?: string | null;
      };

      const incoming = Array.isArray(payload.items) ? payload.items : [];
      setItems((prev) => dedupePosts([...prev, ...incoming]));
      setNextCursor(payload.nextCursor ?? null);
    } catch {
      setError("Could not load more trips. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {hasItems ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((post) => (
            <PostFeedCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No posts yet. Publish your first itinerary to start the feed.
        </div>
      )}

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      {nextCursor ? (
        <div className="flex justify-center">
          <button
            aria-label="Load more trips"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-6 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={loadMore}
            type="button"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Loading..." : "Load More Trips"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
