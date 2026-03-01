"use client";

import { useMemo, useState } from "react";
import { Settings2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Suggestion = { placeId: string; text: string };

type PreferenceState = {
  budget: "budget" | "mid" | "luxury";
  days: 1 | 2 | 3;
  pace: "slow" | "balanced" | "packed";
  vibeTags: string;
  dietary: string;
};

export function CreateItineraryForm({ initialPlaceId }: { initialPlaceId?: string }) {
  const [caption, setCaption] = useState("");
  const [linksInput, setLinksInput] = useState("");
  const [metadataPreview, setMetadataPreview] = useState<Array<{ title?: string; url: string }>>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(initialPlaceId || "");
  const [publishAfterCreate, setPublishAfterCreate] = useState(true);
  const [visibility, setVisibility] = useState<"PUBLIC" | "UNLISTED">("PUBLIC");
  const [status, setStatus] = useState("");
  const [tripUrl, setTripUrl] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [pref, setPref] = useState<PreferenceState>({
    budget: "mid",
    days: 2,
    pace: "balanced",
    vibeTags: "food, culture",
    dietary: ""
  });

  const parsedLinks = useMemo(
    () =>
      linksInput
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 5),
    [linksInput]
  );

  async function detectLocation() {
    setStatus("Parsing social input...");
    const response = await fetch("/api/social/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: caption,
        links: parsedLinks
      })
    });

    const data = await response.json();
    setHints(data.hints || []);
    setMetadataPreview((data.metadata || []).map((item: any) => ({ title: item.title, url: item.url })));

    if (data.resolved?.placeId) {
      setSelectedPlaceId(data.resolved.placeId);
      setSuggestions([data.resolved]);
      setStatus(`Resolved location: ${data.resolved.text}`);
      return;
    }

    const ambiguous = (data.ambiguous || []) as Suggestion[];
    setSuggestions(ambiguous);
    if (ambiguous[0]?.placeId) {
      setSelectedPlaceId(ambiguous[0].placeId);
    }

    setStatus(ambiguous.length ? "Select a location suggestion." : "No confident location found.");
  }

  async function buildItinerary() {
    if (!selectedPlaceId) {
      setStatus("Pick a location first.");
      return;
    }

    setStatus("Loading place details...");
    const detailsResponse = await fetch(`/api/places/details?placeId=${encodeURIComponent(selectedPlaceId)}`);
    const detailsData = await detailsResponse.json();
    const place = detailsData.place;
    if (!place) {
      setStatus("Failed to load place details.");
      return;
    }

    setStatus("Generating itinerary...");
    const tripResponse = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: selectedPlaceId,
        title: `${place.name} Social Plan`,
        centerLat: place.lat,
        centerLng: place.lng,
        days: pref.days,
        budget: pref.budget,
        preferences: {
          budget: pref.budget,
          days: pref.days,
          pace: pref.pace,
          vibeTags: pref.vibeTags.split(",").map((v) => v.trim()).filter(Boolean),
          dietary: pref.dietary.split(",").map((v) => v.trim()).filter(Boolean)
        }
      })
    });

    const tripData = await tripResponse.json();
    if (!tripData.trip?.id || !tripData.trip?.slug) {
      setStatus("Failed to create trip.");
      return;
    }

    const nextTripUrl = `/trip/${tripData.trip.slug}`;
    setTripUrl(nextTripUrl);

    if (!publishAfterCreate) {
      setStatus("Trip created.");
      return;
    }

    setStatus("Publishing post...");
    const postResponse = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: tripData.trip.id,
        caption,
        mediaUrl: parsedLinks[0] || null,
        visibility,
        destinationLabel: place.name,
        tags: pref.vibeTags.split(",").map((value) => value.trim()).filter(Boolean),
        links: parsedLinks
      })
    });

    const postData = await postResponse.json();
    if (postData.post?.id) {
      setPostUrl(`/post/${postData.post.id}`);
      setStatus("Trip created and post published.");
    } else {
      setStatus(postData.error || "Trip created, but post publishing failed.");
    }
  }

  return (
    <Card className="space-y-6 rounded-2xl p-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Create Personalized Itinerary</h1>
        <p className="text-sm text-muted-foreground">Paste links and caption text, tune preferences, then generate and optionally publish.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Caption / context</label>
        <Textarea className="min-h-24 rounded-xl" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Weekend in Paris with food and museums" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Social links (1-5)</label>
        <Textarea className="min-h-24 rounded-xl" value={linksInput} onChange={(e) => setLinksInput(e.target.value)} placeholder="https://instagram... (one per line)" />
      </div>

      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Settings2 className="h-3.5 w-3.5" />
          Trip preferences
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" value={pref.budget} onChange={(e) => setPref((p) => ({ ...p, budget: e.target.value as PreferenceState["budget"] }))}>
            <option value="budget">Budget</option>
            <option value="mid">Mid</option>
            <option value="luxury">Luxury</option>
          </select>
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" value={pref.days} onChange={(e) => setPref((p) => ({ ...p, days: Number(e.target.value) as PreferenceState["days"] }))}>
            <option value={1}>1 day</option>
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
          </select>
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" value={pref.pace} onChange={(e) => setPref((p) => ({ ...p, pace: e.target.value as PreferenceState["pace"] }))}>
            <option value="slow">Slow</option>
            <option value="balanced">Balanced</option>
            <option value="packed">Packed</option>
          </select>
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "UNLISTED")}>
            <option value="PUBLIC">Public post</option>
            <option value="UNLISTED">Unlisted post</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
            <input type="checkbox" checked={publishAfterCreate} onChange={(e) => setPublishAfterCreate(e.target.checked)} />
            Publish post
          </label>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <Input className="rounded-lg bg-white" placeholder="Vibe tags (comma separated)" value={pref.vibeTags} onChange={(e) => setPref((p) => ({ ...p, vibeTags: e.target.value }))} />
          <Input className="rounded-lg bg-white" placeholder="Dietary prefs (optional)" value={pref.dietary} onChange={(e) => setPref((p) => ({ ...p, dietary: e.target.value }))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl px-4 font-bold" variant="outline" onClick={detectLocation}>
          <Wand2 className="mr-2 h-4 w-4" />
          Parse links + detect location
        </Button>
        <Button className="rounded-xl px-4 font-bold" onClick={buildItinerary}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate itinerary
        </Button>
      </div>

      {hints.length ? (
        <div className="flex flex-wrap gap-2">
          {hints.map((hint) => (
            <span key={hint} className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {hint}
            </span>
          ))}
        </div>
      ) : null}
      {metadataPreview.length ? (
        <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-xs">
          {metadataPreview.map((meta) => (
            <p key={meta.url}>Source: {meta.title || meta.url}</p>
          ))}
        </div>
      ) : null}

      {suggestions.length ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Location suggestions</p>
          {suggestions.map((suggestion) => (
            <label key={suggestion.placeId} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
              <input
                type="radio"
                name="location"
                checked={selectedPlaceId === suggestion.placeId}
                onChange={() => setSelectedPlaceId(suggestion.placeId)}
              />
              {suggestion.text}
            </label>
          ))}
        </div>
      ) : null}

      {tripUrl ? <p className="text-sm">Trip: <a className="font-semibold text-primary underline" href={tripUrl}>{tripUrl}</a></p> : null}
      {postUrl ? <p className="text-sm">Post: <a className="font-semibold text-primary underline" href={postUrl}>{postUrl}</a></p> : null}
      {status ? <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{status}</p> : null}
    </Card>
  );
}
