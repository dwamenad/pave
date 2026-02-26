"use client";

import Link from "next/link";
import { useState } from "react";
import type { PostSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";

type Props = {
  post: PostSummary;
};

export function PostFeedCard({ post }: Props) {
  const [likes, setLikes] = useState(post.counts.likes);
  const [saves, setSaves] = useState(post.counts.saves);

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

  return (
    <article className="space-y-3 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/profile/${post.author.username}`} className="text-sm font-semibold hover:underline">
          @{post.author.username || post.author.name || "traveler"}
        </Link>
        <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <p className="text-sm">{post.caption}</p>
      {post.mediaUrl ? (
        <p className="rounded border bg-muted px-3 py-2 text-xs text-muted-foreground">Media: {post.mediaUrl}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 text-xs">
        {post.destinationLabel ? <span className="rounded-full bg-muted px-2 py-1">{post.destinationLabel}</span> : null}
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-full border px-2 py-1">#{tag}</span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link href={`/post/${post.id}`} className="rounded border px-2 py-1 hover:bg-muted">Open post</Link>
        <Link href={`/trip/${post.trip.slug}`} className="rounded border px-2 py-1 hover:bg-muted">View itinerary</Link>
        <Button className="h-7 px-2 text-xs" variant="outline" onClick={toggleLike}>Like ({likes})</Button>
        <Button className="h-7 px-2 text-xs" variant="outline" onClick={toggleSave}>Save ({saves})</Button>
        <span className="text-muted-foreground">Comments: {post.counts.comments}</span>
      </div>
    </article>
  );
}
