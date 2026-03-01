"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag, MessageCircle, Send, Sparkles } from "lucide-react";
import type { PostDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PostDetailClient({ initialPost }: { initialPost: PostDetail }) {
  const [post, setPost] = useState(initialPost);
  const [commentText, setCommentText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const profileHref = post.author.username ? `/profile/${post.author.username}` : null;

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-8">
        <article className="surface-card overflow-hidden">
          <div className="h-72 bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-100">
            {post.mediaUrl && /^https?:\/\//.test(post.mediaUrl) ? (
              <img alt={post.trip.title} className="h-full w-full object-cover" src={post.mediaUrl} />
            ) : (
              <div className="flex h-full items-end p-6">
                <p className="text-xl font-bold text-slate-800">{post.destinationLabel || post.trip.title}</p>
              </div>
            )}
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              {profileHref ? (
                <Link href={profileHref} className="text-sm font-semibold hover:underline">
                  @{post.author.username || post.author.name || "traveler"}
                </Link>
              ) : (
                <span className="text-sm font-semibold">@{post.author.name || "traveler"}</span>
              )}
              <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm">{post.caption}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link href={`/trip/${post.trip.slug}`} className="rounded-lg border bg-white px-3 py-1.5 font-semibold hover:bg-muted">
                Open itinerary
              </Link>
              <span className="rounded-full bg-muted px-2 py-1">Likes: {post.counts.likes}</span>
              <span className="rounded-full bg-muted px-2 py-1">Saves: {post.counts.saves}</span>
              <span className="rounded-full bg-muted px-2 py-1">Comments: {post.counts.comments}</span>
            </div>
          </div>
        </article>

        {post.sourceLinks.length ? (
          <section className="surface-card p-4">
            <h3 className="mb-3 text-sm font-bold">Source links</h3>
            <div className="space-y-2">
              {post.sourceLinks.map((source) => (
                <a key={source.url} className="block rounded-lg border bg-muted/30 p-3 text-xs hover:bg-muted/50" href={source.url} rel="noreferrer" target="_blank">
                  <p className="font-semibold">{source.title || source.url}</p>
                  {source.description ? <p className="mt-1 text-muted-foreground">{source.description}</p> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <aside className="space-y-4 lg:col-span-4">
        <section className="surface-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <MessageCircle className="h-4 w-4 text-primary" />
            Comments
          </h3>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {post.comments.map((comment) => (
              <article key={comment.id} className="rounded-lg border bg-muted/30 p-2">
                <p className="text-xs font-medium">@{comment.author.username || comment.author.name || "traveler"}</p>
                <p className="text-sm">{comment.body}</p>
              </article>
            ))}
            {!post.comments.length ? <p className="text-xs text-muted-foreground">No comments yet.</p> : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Input className="rounded-lg" placeholder="Add a comment" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <Button className="h-10 w-10 rounded-lg p-0" onClick={addComment}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <section className="surface-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Flag className="h-4 w-4 text-primary" />
            Report content
          </h3>
          <div className="flex gap-2">
            <Input className="rounded-lg" placeholder="Reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
            <Button variant="outline" onClick={reportPost}>Report</Button>
          </div>
        </section>

        <Link
          href={`/trip/${post.trip.slug}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Remix this trip
        </Link>
      </aside>
    </div>
  );
}
