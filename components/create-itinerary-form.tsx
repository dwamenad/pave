"use client";

import type {
  AiDraftFallbackReason,
  AiTripDraftResponse,
  CreateTripFromDraftFailureCode,
  CreateTripFromDraftRequest
} from "@pave/contracts";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, LocateFixed, Sparkles, Wand2 } from "lucide-react";
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

type CreateStep =
  | "idle"
  | "parsing"
  | "location_resolved"
  | "drafting"
  | "review_ready"
  | "saving"
  | "published"
  | "degraded";

type ParseResponse = {
  hints?: string[];
  resolved?: Suggestion;
  ambiguous?: Suggestion[];
  metadata?: Array<{ title?: string; url: string }>;
  resolution?: "resolved" | "ambiguous" | "unresolved" | "degraded";
  code?: string;
  mockMode?: boolean;
  error?: string;
};

type PlaceDetailsResponse = {
  place?: {
    placeId: string;
    name: string;
    lat: number;
    lng: number;
  };
  code?: string;
  degraded?: boolean;
  stale?: boolean;
  cacheState?: "hit" | "stale" | "miss";
  mockMode?: boolean;
};

type StatusContext = {
  resolution?: ParseResponse["resolution"];
  code?: string;
  generationMode?: "ai" | "fallback" | "standard";
  fallbackReason?: AiDraftFallbackReason | CreateTripFromDraftFailureCode | null;
  cacheState?: "hit" | "stale" | "miss";
  publishAfterCreate?: boolean;
  mockMode?: boolean;
};

function reasonCopy(code?: string | null) {
  if (code === "provider_misconfigured") return "The place provider is not configured in this environment yet.";
  if (code === "provider_unavailable") return "The place provider is temporarily unavailable. Retry in a moment or use mock mode locally.";
  if (code === "rate_limited") return "This action is being rate limited right now. Please wait a moment and retry.";
  if (code === "invalid_request") return "The request could not be completed. Review the selected location and try again.";
  if (code === "draft_day_mismatch") return "The saved draft no longer matches the selected day count. Redraft the trip first.";
  if (code === "duplicate_places") return "This draft includes duplicate places and needs to be regenerated before saving.";
  if (code === "too_many_stays") return "This draft includes more than one stay recommendation. Use the standard generator or redraft it.";
  if (code === "destination_unresolved") return "The destination could not be resolved at save time. Re-run location parsing first.";
  if (code === "place_unresolved") return "One or more stops could not be resolved at save time. Redraft the plan or use the standard generator.";
  if (code === "missing_place") return "No destination could be resolved for this draft.";
  if (code === "unresolved_places") return "The AI draft referenced places that could not be verified.";
  if (code === "duplicate_places") return "The draft duplicated places, so we switched to a safer fallback.";
  if (code === "policy_invalid") return "The draft violated Pave's itinerary guardrails, so we switched to a safer fallback.";
  if (code === "model_timeout") return "The AI response timed out, so the deterministic planner stepped in instead.";
  if (code === "model_error") return "The AI response could not be used, so the deterministic planner stepped in instead.";
  if (code === "ai_disabled") return "AI drafting is disabled right now, so the standard generator stays available.";
  return "Something went wrong in this step. You can retry or use the standard generator.";
}

function createStatusMessage(step: CreateStep, context: StatusContext) {
  switch (step) {
    case "idle":
      return "Paste social travel context, then parse the destination to start building a trip.";
    case "parsing":
      return "Parsing social input and resolving the most likely destination...";
    case "location_resolved":
      if (context.resolution === "ambiguous") {
        return "Location suggestions are ready. Review the selected destination before drafting the trip.";
      }
      return "Destination resolved. You can draft with AI or use the standard generator.";
    case "drafting":
      return context.generationMode === "standard"
        ? "Generating a deterministic itinerary from the resolved destination..."
        : "Drafting an itinerary with Pave AI...";
    case "review_ready":
      if (context.generationMode === "fallback") {
        return `Fallback draft ready for review. ${reasonCopy(context.fallbackReason)}`;
      }
      return "AI draft ready for review. Check the days and save when it looks right.";
    case "saving":
      return "Saving the reviewed trip and preparing it for publishing...";
    case "published":
      return context.publishAfterCreate ? "Trip created and post published." : "Trip created successfully.";
    case "degraded":
      return reasonCopy(context.fallbackReason || context.code);
    default:
      return "Create flow ready.";
  }
}

async function trackClientEvents(events: Array<{ name: string; props: Record<string, unknown> }>) {
  await fetch("/api/events/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events })
  }).catch(() => undefined);
}

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
  const [step, setStep] = useState<CreateStep>(initialPlaceId ? "location_resolved" : "idle");
  const [statusContext, setStatusContext] = useState<StatusContext>({ resolution: initialPlaceId ? "resolved" : "unresolved" });
  const [tripUrl, setTripUrl] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [draft, setDraft] = useState<AiTripDraftResponse | null>(null);
  const [mockModeActive, setMockModeActive] = useState(false);
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

  const statusMessage = useMemo(() => createStatusMessage(step, { ...statusContext, publishAfterCreate }), [publishAfterCreate, statusContext, step]);

  async function maybePublishPost(tripId: string, destinationLabel: string) {
    if (!publishAfterCreate) {
      return { nextPostUrl: "", failed: false };
    }

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
      return { nextPostUrl, failed: false };
    }

    setStep("degraded");
    setStatusContext((current) => ({ ...current, code: postData.code || "provider_unavailable" }));
    return { nextPostUrl: "", failed: true };
  }

  async function detectLocation() {
    setStep("parsing");
    setDraft(null);
    setTripUrl("");
    setPostUrl("");

    await trackClientEvents([
      {
        name: "start_create_flow",
        props: {
          generationMode: aiCreateEnabled ? "ai" : "standard",
          fallbackReason: null,
          placeResolved: Boolean(selectedPlaceId),
          cacheState: "miss",
          signedIn: null,
          days: pref.days,
          publishAfterCreate
        }
      }
    ]);

    const response = await fetch("/api/social/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: caption,
        links: parsedLinks
      })
    });

    const data = (await response.json()) as ParseResponse;
    setHints(data.hints || []);
    setMetadataPreview((data.metadata || []).map((item) => ({ title: item.title, url: item.url })));
    setMockModeActive(Boolean(data.mockMode));

    const ambiguous = data.ambiguous || [];
    if (data.resolved?.placeId) {
      setSelectedPlaceId(data.resolved.placeId);
      setSuggestions([data.resolved]);
      setStep("location_resolved");
      setStatusContext({ resolution: data.resolution, code: data.code, mockMode: data.mockMode });
    } else if (ambiguous[0]?.placeId) {
      setSuggestions(ambiguous);
      setSelectedPlaceId(ambiguous[0].placeId);
      setStep("location_resolved");
      setStatusContext({ resolution: data.resolution, code: data.code, mockMode: data.mockMode });
    } else if (!response.ok || data.resolution === "degraded") {
      setSuggestions([]);
      setStep("degraded");
      setStatusContext({ resolution: "degraded", code: data.code || "provider_unavailable", mockMode: data.mockMode });
    } else {
      setSuggestions([]);
      setStep("idle");
      setStatusContext({ resolution: data.resolution || "unresolved", code: data.code, mockMode: data.mockMode });
    }

    await trackClientEvents([
      {
        name: "complete_parse_social",
        props: {
          generationMode: aiCreateEnabled ? "ai" : "standard",
          fallbackReason: null,
          placeResolved: Boolean(data.resolved?.placeId || ambiguous[0]?.placeId),
          cacheState: "miss",
          signedIn: null,
          days: pref.days,
          publishAfterCreate
        }
      }
    ]);
  }

  async function buildItinerary() {
    if (!selectedPlaceId) {
      setStep("degraded");
      setStatusContext({ code: "destination_unresolved" });
      return;
    }

    setDraft(null);
    setTripUrl("");
    setPostUrl("");
    setStep("drafting");
    setStatusContext({ generationMode: "standard", fallbackReason: null });

    const detailsResponse = await fetch(`/api/places/details?placeId=${encodeURIComponent(selectedPlaceId)}`);
    const detailsData = (await detailsResponse.json()) as PlaceDetailsResponse;
    setMockModeActive(Boolean(detailsData.mockMode));

    const place = detailsData.place;
    if (!detailsResponse.ok || !place) {
      setStep("degraded");
      setStatusContext({ code: detailsData.code || "provider_unavailable", cacheState: detailsData.cacheState, mockMode: detailsData.mockMode });
      return;
    }

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
      setStep("degraded");
      setStatusContext({ code: tripData.code || "provider_unavailable", cacheState: detailsData.cacheState, mockMode: detailsData.mockMode });
      return;
    }

    const nextTripUrl = `/trip/${tripData.trip.slug}`;
    setTripUrl(nextTripUrl);

    await trackClientEvents([
      {
        name: "complete_trip_create",
        props: {
          generationMode: "standard",
          fallbackReason: null,
          placeResolved: true,
          cacheState: detailsData.cacheState || "miss",
          signedIn: null,
          days: pref.days,
          publishAfterCreate
        }
      }
    ]);

    const publishResult = await maybePublishPost(tripData.trip.id, place.name);
    if (publishResult.failed) {
      return;
    }

    setStep("published");
    setStatusContext({ generationMode: "standard", cacheState: detailsData.cacheState, mockMode: detailsData.mockMode, publishAfterCreate });
    if (publishResult.nextPostUrl) {
      return;
    }
  }

  async function draftWithAi() {
    if (!selectedPlaceId) {
      setStep("degraded");
      setStatusContext({ code: "destination_unresolved" });
      return;
    }

    setTripUrl("");
    setPostUrl("");
    setStep("drafting");
    setStatusContext({ generationMode: "ai", fallbackReason: null });

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

    const draftData = (await response.json()) as AiTripDraftResponse & { error?: string; code?: string };
    if (!response.ok || !draftData.draft) {
      setStep("degraded");
      setStatusContext({ code: draftData.code || "provider_unavailable" });
      return;
    }

    setDraft(draftData);
    setMockModeActive(Boolean(draftData.provider?.mockMode));
    setStep("review_ready");
    setStatusContext({
      generationMode: draftData.generationMode,
      fallbackReason: draftData.fallbackReason ?? null,
      cacheState: draftData.provider?.cacheState,
      mockMode: draftData.provider?.mockMode
    });
  }

  async function acceptDraft() {
    if (!draft) {
      setStep("degraded");
      setStatusContext({ code: "place_unresolved" });
      return;
    }

    setStep("saving");
    setStatusContext({
      generationMode: draft.generationMode,
      fallbackReason: draft.fallbackReason ?? null,
      cacheState: draft.provider?.cacheState,
      mockMode: draft.provider?.mockMode
    });

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
      setStep("degraded");
      setStatusContext({
        generationMode: draft.generationMode,
        fallbackReason: (data.code as CreateTripFromDraftFailureCode | undefined) ?? draft.fallbackReason ?? null,
        code: data.code,
        cacheState: draft.provider?.cacheState,
        mockMode: draft.provider?.mockMode
      });
      return;
    }

    const nextTripUrl = `/trip/${data.trip.slug}`;
    setTripUrl(nextTripUrl);

    await trackClientEvents([
      {
        name: "complete_trip_create",
        props: {
          generationMode: draft.generationMode,
          fallbackReason: draft.fallbackReason ?? null,
          placeResolved: true,
          cacheState: draft.provider?.cacheState ?? "miss",
          signedIn: null,
          days: pref.days,
          publishAfterCreate
        }
      }
    ]);

    const publishResult = await maybePublishPost(data.trip.id, draft.draft.destination.name);
    if (publishResult.failed) {
      return;
    }

    setStep("published");
    setStatusContext({
      generationMode: draft.generationMode,
      fallbackReason: draft.fallbackReason ?? null,
      cacheState: draft.provider?.cacheState,
      mockMode: draft.provider?.mockMode,
      publishAfterCreate
    });

    if (publishResult.nextPostUrl) {
      return;
    }
  }

  async function rejectDraft() {
    if (!draft) return;

    const rejected = draft;
    setDraft(null);
    setStep("location_resolved");
    setStatusContext({ resolution: "resolved", generationMode: rejected.generationMode, fallbackReason: rejected.fallbackReason ?? null });
    await trackClientEvents([
      {
        name: "ai_draft_rejected",
        props: {
          generationMode: rejected.generationMode,
          fallbackReason: rejected.fallbackReason ?? null,
          placeResolved: true,
          cacheState: rejected.provider?.cacheState ?? "miss",
          signedIn: null,
          days: pref.days,
          publishAfterCreate
        }
      }
    ]);
  }

  return (
    <Card className="space-y-8 rounded-3xl border-slate-200 p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Personalized Itinerary</h2>
        <p className="mt-1 text-sm text-slate-500">Use social context + preferences to draft, review, and optionally publish.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Parse</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Draft</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Review</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Publish</span>
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

              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "UNLISTED") }>
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

          {mockModeActive ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-slate-700">
              <p className="inline-flex items-center gap-2 font-semibold text-primary">
                <Info className="h-4 w-4" />
                Mock place mode active
              </p>
              <p className="mt-1">Local demo place data is powering this create flow instead of the live provider.</p>
            </div>
          ) : null}

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
                    onChange={() => {
                      setSelectedPlaceId(suggestion.placeId);
                      setStep("location_resolved");
                      setStatusContext((current) => ({ ...current, resolution: "ambiguous" }));
                    }}
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
              {draft.fallbackReason ? <p className="text-xs text-amber-700">Fallback reason: {reasonCopy(draft.fallbackReason)}</p> : null}
              {draft.provider?.cacheState === "stale" ? <p className="text-xs text-amber-700">Destination data came from stale cache because the live provider was unavailable.</p> : null}

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
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{item.category}</span>
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
          {statusMessage ? (
            <p className={`rounded-lg border px-3 py-2 text-xs ${step === "degraded" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
              <span className="inline-flex items-center gap-2 font-medium">
                {step === "degraded" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5 text-primary" />}
                {statusMessage}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
