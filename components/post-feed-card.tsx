"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Heart, MapPin, MessageCircle, MoreHorizontal } from "lucide-react";
import { formatFeedExcerpt } from "@/lib/feed-view-model";
import type { PostSummary } from "@/lib/types";

type Props = {
  post: PostSummary;
};

function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

export function PostFeedCard({ post }: Props) {
  const [likes, setLikes] = useState(post.counts.likes);
  const [saves, setSaves] = useState(post.counts.saves);
  const [imageFailed, setImageFailed] = useState(false);
  const profileHref = post.author.username ? `/profile/${post.author.username}` : null;

  async function toggleLike() {
    const response = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!response.ok) return;
    const data = await response.json();
    setLikes((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
  }

  async function toggleSave() {
    const response = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (!response.ok) return;
    const data = await response.json();
    setSaves((prev) => (data.saved ? prev + 1 : Math.max(0, prev - 1)));
  }

  const showImage = !!post.mediaUrl && !imageFailed && /^https?:\/\//.test(post.mediaUrl);
  const dayBadge = post.trip.daysCount > 0 ? `${post.trip.daysCount} DAYS` : "TRIP";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-100">
        {showImage ? (
          <img
            alt={post.destinationLabel || post.trip.title}
            className="h-full w-full object-cover"
            src={post.mediaUrl || ""}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-tr from-primary/35 via-sky-300/25 to-emerald-300/15 p-4">
            <p className="line-clamp-2 text-sm font-semibold text-slate-800">{post.destinationLabel || post.trip.title}</p>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
          {dayBadge}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 text-2xl font-bold tracking-tight text-slate-900">
              <Link className="hover:text-primary" href={`/post/${post.id}`}>
                {post.destinationLabel || post.trip.title}
              </Link>
            </h3>
            <p className="mt-1 line-clamp-2 text-sm italic text-slate-500">{formatFeedExcerpt(post.caption, 110)}</p>
          </div>
          <button
            aria-label="More post options"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            type="button"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {post.author.image ? (
              <img alt={post.author.name || "Author"} className="h-8 w-8 rounded-full object-cover" src={post.author.image} />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/15" />
            )}
            {profileHref ? (
              <Link className="text-xs font-semibold text-slate-700 hover:text-primary" href={profileHref}>
                @{post.author.username || post.author.name || "traveler"}
              </Link>
            ) : (
              <span className="text-xs font-semibold text-slate-700">@{post.author.name || "traveler"}</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button
              aria-label="Toggle like"
              className="inline-flex items-center gap-1 hover:text-slate-700"
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

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
            <MapPin className="h-3.5 w-3.5" />
            {post.destinationLabel || "Destination"}
          </span>
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-slate-500">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Link
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:opacity-90"
            href={`/trip/${post.trip.slug}`}
          >
            Remix Trip
          </Link>
          <button
            aria-label="Toggle save"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
            onClick={toggleSave}
            type="button"
          >
            <Bookmark className="h-4 w-4" />
            <span className="sr-only">Saved {compactNumber(saves)} times</span>
          </button>
        </div>
      </div>
    </article>
  );
}
