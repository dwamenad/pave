"use client";

import type { AiTripDraftResponse, CreateTripFromDraftRequest } from "@pave/contracts";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, LocateFixed, Sparkles, Wand2 } from "lucide-react";
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
  const aiCreateEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_CREATE === "true";
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
  const [draft, setDraft] = useState<AiTripDraftResponse | null>(null);
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

  const normalizedPreferences = useMemo(
    () => ({
      budget: pref.budget,
      days: pref.days,
      pace: pref.pace,
      vibeTags: pref.vibeTags.split(",").map((value) => value.trim()).filter(Boolean),
      dietary: pref.dietary.split(",").map((value) => value.trim()).filter(Boolean)
    }),
    [pref]
  );

  async function maybePublishPost(tripId: string, destinationLabel: string) {
    if (!publishAfterCreate) {
      return { nextPostUrl: "" };
    }

    setStatus("Publishing post...");
    const postResponse = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        caption,
        mediaUrl: parsedLinks[0] || null,
        visibility,
        destinationLabel,
        tags: normalizedPreferences.vibeTags,
        links: parsedLinks
      })
    });

    const postData = await postResponse.json();
    if (postData.post?.id) {
      const nextPostUrl = `/post/${postData.post.id}`;
      setPostUrl(nextPostUrl);
      return { nextPostUrl };
    }

    setStatus(postData.error || "Trip created, but post publishing failed.");
    return { nextPostUrl: "" };
  }

  async function detectLocation() {
    setStatus("Parsing social input...");
    setDraft(null);
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
    setMetadataPreview((data.metadata || []).map((item: { title?: string; url: string }) => ({ title: item.title, url: item.url })));

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

    setDraft(null);
    setStatus("Loading place details...");
    const detailsResponse = await fetch(`/api/places/details?placeId=${encodeURIComponent(selectedPlaceId)}`);
    const detailsData = await detailsResponse.json();
    const place = detailsData.place;
    if (!place) {
      setStatus("Failed to load place details.");
      return;
    }

    setTripUrl("");
    setPostUrl("");
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
        preferences: normalizedPreferences
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

    const publishResult = await maybePublishPost(tripData.trip.id, place.name);
    if (publishResult.nextPostUrl) {
      setStatus("Trip created and post published.");
    }
  }

  async function draftWithAi() {
    if (!selectedPlaceId) {
      setStatus("Pick a location first.");
      return;
    }

    setTripUrl("");
    setPostUrl("");
    setStatus("Drafting with Pave AI...");

    const response = await fetch("/api/ai/trips/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption,
        links: parsedLinks,
        selectedPlaceId,
        preferences: normalizedPreferences
      })
    });

    const draftData = (await response.json()) as AiTripDraftResponse;
    if (!response.ok) {
      setStatus("Failed to draft itinerary with AI.");
      return;
    }

    setDraft(draftData);
    setStatus(
      draftData.generationMode === "ai"
        ? "AI draft ready for review."
        : `Fallback draft ready for review${draftData.fallbackReason ? ` (${draftData.fallbackReason.replaceAll("_", " ")})` : ""}.`
    );
  }

  async function acceptDraft() {
    if (!draft) {
      setStatus("Draft a plan first.");
      return;
    }

    setStatus("Saving accepted draft...");
    const response = await fetch("/api/trips/from-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: draft.draft,
        preferences: normalizedPreferences,
        editedBeforeSave: false
      } satisfies CreateTripFromDraftRequest)
    });

    const data = await response.json();
    if (!response.ok || !data.trip?.id || !data.trip?.slug) {
      setStatus(data.error || "Failed to save accepted draft.");
      return;
    }

    const nextTripUrl = `/trip/${data.trip.slug}`;
    setTripUrl(nextTripUrl);
    const publishResult = await maybePublishPost(data.trip.id, draft.draft.destination.name);

    if (publishResult.nextPostUrl) {
      setStatus("Accepted draft saved and post published.");
      return;
    }

    setStatus("Accepted draft saved.");
  }

  async function rejectDraft() {
    if (!draft) return;

    const rejected = draft;
    setDraft(null);
    setStatus("AI draft dismissed. You can still use the standard generator.");
    await fetch("/api/events/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [
          {
            name: "ai_draft_rejected",
            props: {
              generationMode: rejected.generationMode,
              fallbackReason: rejected.fallbackReason ?? null
            }
          }
        ]
      })
    }).catch(() => undefined);
  }

  return (
    <Card className="space-y-8 rounded-3xl border-slate-200 p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Personalized Itinerary</h2>
        <p className="mt-1 text-sm text-slate-500">Use social context + preferences to draft, review, and optionally publish.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Parse
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Draft
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Review
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Publish
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Caption / context</label>
            <Textarea
              className="min-h-24 rounded-xl"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Weekend in Paris with food and museums"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Social links (1-5)</label>
            <Textarea
              className="min-h-24 rounded-xl"
              value={linksInput}
              onChange={(e) => setLinksInput(e.target.value)}
              placeholder="https://instagram... (one per line)"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Trip preferences
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={pref.budget} onChange={(e) => setPref((p) => ({ ...p, budget: e.target.value as PreferenceState["budget"] }))}>
                <option value="budget">Budget</option>
                <option value="mid">Mid</option>
                <option value="luxury">Luxury</option>
              </select>

              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={pref.days} onChange={(e) => setPref((p) => ({ ...p, days: Number(e.target.value) as PreferenceState["days"] }))}>
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
              </select>

              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={pref.pace} onChange={(e) => setPref((p) => ({ ...p, pace: e.target.value as PreferenceState["pace"] }))}>
                <option value="slow">Slow</option>
                <option value="balanced">Balanced</option>
                <option value="packed">Packed</option>
              </select>

              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "UNLISTED")}>
                <option value="PUBLIC">Public post</option>
                <option value="UNLISTED">Unlisted post</option>
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Input className="rounded-lg bg-white" placeholder="Vibe tags (comma separated)" value={pref.vibeTags} onChange={(e) => setPref((p) => ({ ...p, vibeTags: e.target.value }))} />
              <Input className="rounded-lg bg-white" placeholder="Dietary prefs (optional)" value={pref.dietary} onChange={(e) => setPref((p) => ({ ...p, dietary: e.target.value }))} />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={publishAfterCreate} onChange={(e) => setPublishAfterCreate(e.target.checked)} />
              Publish post after creating trip
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl px-4 font-bold" variant="outline" onClick={detectLocation}>
              <LocateFixed className="mr-2 h-4 w-4" />
              Parse + detect location
            </Button>
            {aiCreateEnabled ? (
              <Button className="rounded-xl px-4 font-bold" onClick={draftWithAi}>
                <Sparkles className="mr-2 h-4 w-4" />
                Draft with Pave AI
              </Button>
            ) : null}
            <Button className="rounded-xl px-4 font-bold" onClick={buildItinerary} variant={aiCreateEnabled ? "outline" : "default"}>
              <Wand2 className="mr-2 h-4 w-4" />
              Use standard generator
            </Button>
            {tripUrl ? (
              <a
                href={tripUrl}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary"
              >
                Open trip
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Location signals</h3>

          {hints.length ? (
            <div className="flex flex-wrap gap-2">
              {hints.map((hint) => (
                <span key={hint} className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {hint}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Detected hints appear here after parsing.</p>
          )}

          {metadataPreview.length ? (
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {metadataPreview.map((meta) => (
                <p key={meta.url}>Source: {meta.title || meta.url}</p>
              ))}
            </div>
          ) : null}

          {suggestions.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Location suggestions</p>
              {suggestions.map((suggestion) => (
                <label key={suggestion.placeId} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
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

          {draft ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Draft review</p>
                  <h4 className="text-sm font-bold text-slate-900">{draft.draft.title}</h4>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${draft.generationMode === "ai" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
                  {draft.generationMode}
                </span>
              </div>

              <p className="text-xs text-slate-600">{draft.draft.summary}</p>
              {draft.fallbackReason ? (
                <p className="text-xs text-amber-700">Fallback reason: {draft.fallbackReason.replaceAll("_", " ")}</p>
              ) : null}

              <div className="space-y-3">
                {draft.draft.days.map((day) => (
                  <div key={day.dayIndex} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Day {day.dayIndex}</p>
                        <h5 className="text-sm font-bold text-slate-900">{day.title}</h5>
                      </div>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{day.summary}</p>
                    <div className="mt-3 space-y-2">
                      {day.items.map((item) => (
                        <div key={`${day.dayIndex}-${item.placeId}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              {item.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{item.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="rounded-xl px-4 font-bold" onClick={acceptDraft}>
                  Accept AI draft
                </Button>
                <Button className="rounded-xl px-4 font-bold" variant="outline" onClick={buildItinerary}>
                  Use standard generator instead
                </Button>
                <Button className="rounded-xl px-4 font-bold" variant="ghost" onClick={rejectDraft}>
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}

          {tripUrl ? (
            <p className="text-sm text-slate-600">
              Trip:{" "}
              <a className="font-semibold text-primary underline" href={tripUrl}>
                {tripUrl}
              </a>
            </p>
          ) : null}
          {postUrl ? (
            <p className="text-sm text-slate-600">
              Post:{" "}
              <a className="font-semibold text-primary underline" href={postUrl}>
                {postUrl}
              </a>
            </p>
          ) : null}
          {status ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">{status}</p> : null}
        </div>
      </div>
    </Card>
  );
}
