"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const data = await response.json();

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
    const data = await response.json();
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
      setStatus("PDF generation failed.");
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
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <p className="text-sm font-semibold">Social actions</p>
      <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Post caption" />
      <select className="rounded border px-3 py-2 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "UNLISTED")}>
        <option value="PUBLIC">Public</option>
        <option value="UNLISTED">Unlisted</option>
      </select>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={publishPost}>Publish post</Button>
        <Button variant="outline" onClick={remixTrip}>Remix this trip</Button>
        <Button variant="outline" onClick={exportPdf}>Export PDF</Button>
      </div>
      {postUrl ? <p className="text-xs">Post: <a className="underline" href={postUrl}>{postUrl}</a></p> : null}
      {remixUrl ? <p className="text-xs">Remix: <a className="underline" href={remixUrl}>{remixUrl}</a></p> : null}
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
