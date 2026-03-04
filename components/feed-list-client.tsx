"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { PostFeedCard } from "@/components/post-feed-card";
import { EmptyState } from "@/components/social/empty-state";
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
        <div className="social-feed-grid">
          {items.map((post) => (
            <PostFeedCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No posts yet"
          description="Publish your first itinerary to start the feed and get discovered."
          icon={<Sparkles className="h-4 w-4" />}
        />
      )}

      {error ? (
        <div aria-live="assertive" role="alert" className="flex items-center justify-center gap-3 text-sm text-red-600">
          <span>{error}</span>
          {nextCursor ? (
            <button
              className="inline-flex min-h-10 items-center gap-1 rounded-md border border-red-200 px-3 py-1 font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              onClick={loadMore}
              type="button"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center">
          <button
            aria-label="Load more trips"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-6 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
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
