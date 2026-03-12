"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { Bookmark, Ellipsis, Heart, MessageCircle } from "lucide-react";
import { formatFeedExcerpt } from "@/lib/feed-view-model";
import type { PostSummary } from "@/lib/types";

type Props = {
  post: PostSummary;
};

function compactNumber(value: number) {
  if (value >= 1000000) {
    const rounded = Math.round((value / 1000000) * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}m`;
  }

  if (value >= 1000) {
    const rounded = Math.round((value / 1000) * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k`;
  }

  return `${value}`;
}

function PostFeedCardComponent({ post }: Props) {
  const [likes, setLikes] = useState(post.counts.likes);
  const [saves, setSaves] = useState(post.counts.saves);
  const [imageFailed, setImageFailed] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const profileHref = useMemo(
    () => (post.author.username ? `/profile/${post.author.username}` : null),
    [post.author.username]
  );

  async function toggleLike() {
    if (pendingLike) return;
    setPendingLike(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!response.ok) return;

      const data = (await response.json()) as { liked?: boolean };
      setLikes((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setPendingLike(false);
    }
  }

  async function toggleSave() {
    if (pendingSave) return;
    setPendingSave(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
      if (!response.ok) return;

      const data = (await response.json()) as { saved?: boolean };
      setSaves((prev) => (data.saved ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setPendingSave(false);
    }
  }

  const showImage = !!post.mediaUrl && !imageFailed && /^https?:\/\//.test(post.mediaUrl);
  const dayBadge = post.trip.daysCount > 0 ? `${post.trip.daysCount} DAYS` : "TRIP";
  const excerpt = useMemo(() => formatFeedExcerpt(post.caption, 110), [post.caption]);

  return (
    <article className="social-card group overflow-hidden hover:shadow-md focus-within:ring-2 focus-within:ring-primary/30">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-100 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-blue-950/30">
        {showImage ? (
          <img
            alt={post.destinationLabel || post.trip.title}
            className="h-full w-full object-cover transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"
            decoding="async"
            loading="lazy"
            src={post.mediaUrl || ""}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="social-floating-gradient flex h-full items-end p-4">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{post.destinationLabel || post.trip.title}</p>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-lg bg-card/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm">
          {dayBadge}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 text-3xl font-extrabold leading-tight tracking-tight text-foreground">
              <Link className="hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35" href={`/post/${post.id}`}>
                {post.destinationLabel || post.trip.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-2 text-sm italic leading-relaxed text-muted-foreground">{excerpt}</p>
          </div>
          <button
            aria-label="More post options"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            type="button"
          >
            <Ellipsis className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {post.author.image ? (
              <img
                alt={post.author.name || "Author"}
                className="h-8 w-8 rounded-full object-cover"
                decoding="async"
                loading="lazy"
                src={post.author.image}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/15" />
            )}
            {profileHref ? (
              <Link className="text-xs font-semibold text-foreground hover:text-primary" href={profileHref}>
                @{post.author.username || post.author.name || "traveler"}
              </Link>
            ) : (
              <span className="text-xs font-semibold text-foreground">@{post.author.name || "traveler"}</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button
              aria-label="Toggle like"
              className="inline-flex min-h-10 items-center gap-1 rounded-md px-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingLike}
              onClick={toggleLike}
              type="button"
            >
              <Heart className="h-3.5 w-3.5" />
              {compactNumber(likes)}
            </button>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {compactNumber(post.counts.comments)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            href={`/trip/${post.trip.slug}`}
          >
            Remix Trip
          </Link>
          <button
            aria-label={`Toggle save (${compactNumber(saves)} saves)`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card px-3 text-muted-foreground hover:bg-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingSave}
            onClick={toggleSave}
            type="button"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export const PostFeedCard = memo(PostFeedCardComponent);
