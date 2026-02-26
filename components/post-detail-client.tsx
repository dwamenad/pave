"use client";

import Link from "next/link";
import { useState } from "react";
import type { PostDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PostDetailClient({ initialPost }: { initialPost: PostDetail }) {
  const [post, setPost] = useState(initialPost);
  const [commentText, setCommentText] = useState("");
  const [reportReason, setReportReason] = useState("");

  async function addComment() {
    if (!commentText.trim()) return;
    const response = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText })
    });
    if (!response.ok) return;

    const refresh = await fetch(`/api/posts/${post.id}`);
    const data = await refresh.json();
    setPost(data.post);
    setCommentText("");
  }

  async function reportPost() {
    if (!reportReason.trim()) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "POST", targetId: post.id, reason: reportReason })
    });
    setReportReason("");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/profile/${post.author.username}`} className="text-sm font-semibold hover:underline">
            @{post.author.username || post.author.name || "traveler"}
          </Link>
          <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm">{post.caption}</p>
        {post.mediaUrl ? <p className="mt-2 text-xs text-muted-foreground">Media: {post.mediaUrl}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href={`/trip/${post.trip.slug}`} className="rounded border px-2 py-1 hover:bg-muted">Open itinerary</Link>
          <span>Likes: {post.counts.likes}</span>
          <span>Saves: {post.counts.saves}</span>
          <span>Comments: {post.counts.comments}</span>
        </div>
      </section>

      {post.sourceLinks.length ? (
        <section className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Source links</h3>
          <div className="mt-2 space-y-2">
            {post.sourceLinks.map((source) => (
              <div key={source.url} className="rounded border p-2 text-xs">
                <p className="font-medium">{source.title || source.url}</p>
                {source.description ? <p className="text-muted-foreground">{source.description}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Comments</h3>
        <div className="mt-2 space-y-2">
          {post.comments.map((comment) => (
            <article key={comment.id} className="rounded border p-2">
              <p className="text-xs font-medium">@{comment.author.username || comment.author.name || "traveler"}</p>
              <p className="text-sm">{comment.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Input placeholder="Add a comment" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <Button onClick={addComment}>Post</Button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Report content</h3>
        <div className="mt-2 flex gap-2">
          <Input placeholder="Reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
          <Button variant="outline" onClick={reportPost}>Report</Button>
        </div>
      </section>
    </div>
  );
}
