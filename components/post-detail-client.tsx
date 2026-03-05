"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  Camera,
  Flag,
  MapPin,
  MessageCircle,
  Play,
  Send,
  Share2,
  Sparkles,
  UserRound,
  type LucideIcon
} from "lucide-react";
import type { PostDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function sourceLinkMeta(url: string): { icon: LucideIcon; label: string } {
  const lower = url.toLowerCase();
  if (lower.includes("instagram")) return { icon: Camera, label: "Original Post" };
  if (lower.includes("tiktok") || lower.includes("youtube") || lower.includes("youtu.be")) {
    return { icon: Play, label: "Original Reel" };
  }
  if (lower.includes("x.com") || lower.includes("twitter.com")) {
    return { icon: MessageCircle, label: "Tweet Source" };
  }
  return { icon: Sparkles, label: "Source Link" };
}

function distanceLabel(items: number) {
  if (items <= 2) return `${items} activities`;
  if (items <= 4) return `${items} activities · easy pace`;
  if (items <= 6) return `${items} activities · medium pace`;
  return `${items} activities · full day`;
}

export function PostDetailClient({ initialPost }: { initialPost: PostDetail }) {
  const [post, setPost] = useState(initialPost);
  const [commentText, setCommentText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [pendingComment, setPendingComment] = useState(false);
  const [pendingReport, setPendingReport] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingShare, setPendingShare] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(post.counts.saves);
  const profileHref = post.author.username ? `/profile/${post.author.username}` : null;

  const dayPreview = useMemo(() => {
    if (post.trip.daysPreview.length) return post.trip.daysPreview;

    return Array.from({ length: Math.max(1, post.trip.daysCount || 1) }, (_, index) => ({
      id: `preview-${index + 1}`,
      dayIndex: index + 1,
      items: [] as Array<{ id: string; name: string; category: string; notes?: string | null }>
    }));
  }, [post.trip.daysCount, post.trip.daysPreview]);

  async function refreshPost() {
    const refresh = await fetch(`/api/posts/${post.id}`);
    if (!refresh.ok) return;
    const data = (await refresh.json()) as { post?: PostDetail };
    if (data.post) setPost(data.post);
  }

  async function addComment() {
    if (!commentText.trim() || pendingComment) return;
    setPendingComment(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText })
      });
      if (!response.ok) return;

      await refreshPost();
      setCommentText("");
    } finally {
      setPendingComment(false);
    }
  }

  async function reportPost() {
    if (!reportReason.trim() || pendingReport) return;
    setPendingReport(true);

    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "POST", targetId: post.id, reason: reportReason })
      });
      setReportReason("");
    } finally {
      setPendingReport(false);
    }
  }

  async function toggleSave() {
    if (pendingSave) return;
    setPendingSave(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
      if (!response.ok) return;
      const data = (await response.json()) as { saved?: boolean };
      const nextSaved = Boolean(data.saved);
      setSaved(nextSaved);
      setSaveCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setPendingSave(false);
    }
  }

  async function sharePost() {
    if (pendingShare) return;
    setPendingShare(true);

    try {
      const shareData = {
        title: post.trip.title,
        text: post.caption.slice(0, 140),
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // no-op when share is cancelled or clipboard is unavailable
    } finally {
      setPendingShare(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <section className="space-y-10 lg:col-span-8">
        <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
              {post.trip.title}
            </h1>
            <p className="mt-2 text-lg text-slate-600">{post.caption}</p>
          </div>

          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-tr from-cyan-100 via-sky-100 to-blue-100">
            {post.mediaUrl && /^https?:\/\//.test(post.mediaUrl) ? (
              <img alt={post.trip.title} className="h-full w-full object-cover" src={post.mediaUrl} />
            ) : (
              <div className="social-floating-gradient flex h-full items-end p-6">
                <p className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800 backdrop-blur">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {post.destinationLabel || post.trip.title}
                </p>
              </div>
            )}
          </div>

          {post.sourceLinks.length ? (
            <div className="flex flex-wrap gap-2">
              {post.sourceLinks.slice(0, 3).map((source) => {
                const meta = sourceLinkMeta(source.url);
                const Icon = meta.icon;
                return (
                  <a
                    key={source.url}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </a>
                );
              })}
            </div>
          ) : null}
        </article>

        <section className="relative space-y-10 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-[2px] before:bg-slate-200">
          {dayPreview.map((day) => (
            <article key={day.id} className="relative pl-12">
              <div className="absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-primary bg-white">
                <span className="text-xs font-bold text-primary">{String(day.dayIndex).padStart(2, "0")}</span>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Day {day.dayIndex}: {day.items[0]?.name || "Itinerary preview"}
                  </h3>
                  <p className="text-sm text-slate-500">{distanceLabel(day.items.length)}</p>
                </div>

                {day.items.length ? (
                  <div className="space-y-3">
                    {day.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.category}</p>
                        <p className="text-base font-semibold text-slate-900">{item.name}</p>
                        {item.notes ? <p className="mt-1 text-sm text-slate-600">{item.notes}</p> : null}
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-28 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100" />
                      <div className="h-28 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    Activity details are available in the full trip view.
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      </section>

      <aside className="space-y-4 lg:col-span-4">
        <div className="social-sticky-rail social-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            {post.author.image ? (
              <img alt={post.author.name || "Creator"} className="h-12 w-12 rounded-full object-cover" src={post.author.image} />
            ) : (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <UserRound className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Created by</p>
              {profileHref ? (
                <Link href={profileHref} className="text-base font-bold text-slate-900 hover:text-primary">
                  {post.author.name || post.author.username || "Traveler"}
                </Link>
              ) : (
                <p className="text-base font-bold text-slate-900">{post.author.name || "Traveler"}</p>
              )}
              <p className="text-xs text-slate-500">{post.counts.likes + post.counts.comments} total interactions</p>
            </div>
          </div>

          <Link
            href={`/trip/${post.trip.slug}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <Sparkles className="h-4 w-4" />
            Remix this Trip
          </Link>

          <button
            type="button"
            onClick={toggleSave}
            disabled={pendingSave}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
            {saved ? "Saved itinerary" : "Save itinerary"} ({saveCount})
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs text-slate-500">Duration</span>
              <span className="font-bold text-slate-900">{post.trip.daysCount || 1} Days</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs text-slate-500">Comments</span>
              <span className="font-bold text-slate-900">{post.counts.comments}</span>
            </div>
          </div>

          <section>
            <h3 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-900">
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Comments
              </span>
              <span className="text-xs font-normal text-slate-400">{post.counts.comments} replies</span>
            </h3>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {post.comments.map((comment) => (
                <article key={comment.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-900">@{comment.author.username || comment.author.name || "traveler"}</p>
                  <p className="mt-1 text-xs text-slate-600">{comment.body}</p>
                </article>
              ))}
              {!post.comments.length ? <p className="text-xs text-slate-500">No comments yet.</p> : null}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                className="h-10 rounded-xl border-slate-200 bg-slate-100"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button className="h-10 w-10 rounded-xl p-0" onClick={addComment} disabled={pendingComment} aria-label="Send comment">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section>
            <div className="flex gap-2">
              <Input
                className="h-10 rounded-xl"
                placeholder="Report reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <Button className="h-10 rounded-xl" variant="outline" onClick={reportPost} disabled={pendingReport}>
                <Flag className="mr-1 h-3.5 w-3.5" />
                Report
              </Button>
            </div>
            <button
              type="button"
              onClick={sharePost}
              disabled={pendingShare}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share itinerary
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}
