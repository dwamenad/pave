"use client";

import { useState } from "react";
import { Download, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function exportFailureCopy(code?: string) {
  if (code === "rate_limited") return "PDF export is being rate limited right now. Give it a minute and retry.";
  if (code === "trip_not_found") return "We couldn't find this trip to export anymore.";
  if (code === "unauthorized") return "Sign in again before exporting this trip.";
  return "PDF generation is unavailable right now. You can retry in a moment.";
}

export function TripSocialActions({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const [caption, setCaption] = useState(`My itinerary for ${tripTitle}`);
  const [visibility, setVisibility] = useState<"PUBLIC" | "UNLISTED">("PUBLIC");
  const [postUrl, setPostUrl] = useState("");
  const [remixUrl, setRemixUrl] = useState("");
  const [status, setStatus] = useState("");

  async function publishPost() {
    setStatus("Publishing...");
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        caption,
        visibility,
        tags: ["itinerary"]
      })
    });
    const data = (await response.json()) as { post?: { id: string }; error?: string };

    if (data.post?.id) {
      setPostUrl(`/post/${data.post.id}`);
      setStatus("Published.");
      return;
    }

    setStatus(data.error || "Publish failed.");
  }

  async function remixTrip() {
    setStatus("Remixing...");
    const response = await fetch(`/api/trips/${tripId}/remix`, { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };

    if (data.url) {
      setRemixUrl(data.url);
      setStatus("Remix created.");
      return;
    }

    setStatus(data.error || "Remix failed.");
  }

  async function exportPdf() {
    setStatus("Generating PDF...");
    const response = await fetch(`/api/trips/${tripId}/export/pdf`, { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
      setStatus(data.error || exportFailureCopy(data.code));
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${tripTitle.replace(/\s+/g, "-").toLowerCase()}-itinerary.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("PDF downloaded.");
  }

  return (
    <div className="space-y-3">
      <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Post caption" className="rounded-lg" />

      <select
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "UNLISTED")}
      >
        <option value="PUBLIC">Public</option>
        <option value="UNLISTED">Unlisted</option>
      </select>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={publishPost} className="rounded-lg">
          <Upload className="mr-1 h-3.5 w-3.5" />
          Publish post
        </Button>
        <Button variant="outline" onClick={remixTrip} className="rounded-lg">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Remix this trip
        </Button>
        <Button variant="outline" onClick={exportPdf} className="rounded-lg">
          <Download className="mr-1 h-3.5 w-3.5" />
          Export PDF
        </Button>
      </div>

      {postUrl ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Post: <a className="font-semibold text-primary underline" href={postUrl}>{postUrl}</a>
        </p>
      ) : null}

      {remixUrl ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Remix: <a className="font-semibold text-primary underline" href={remixUrl}>{remixUrl}</a>
        </p>
      ) : null}

      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
