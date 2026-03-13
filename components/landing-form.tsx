"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, MapPin, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Suggestion = { placeId: string; text: string };

export function LandingForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [socialInput, setSocialInput] = useState("");
  const [linksInput, setLinksInput] = useState("");
  const [parseResult, setParseResult] = useState<{ hints: string[]; ambiguous: Suggestion[]; resolved?: Suggestion } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canBuild = useMemo(() => !!suggestions[0] || !!parseResult?.resolved || parseResult?.ambiguous?.length, [parseResult, suggestions]);

  async function onSearchChange(value: string) {
    setQuery(value);
    setError("");
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(value)}&sessionToken=${sessionToken}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : { suggestions: [] };
      if (!response.ok) {
        setError(data.error || "Failed to load suggestions.");
      }
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
      setError("Failed to load suggestions.");
    }
  }

  async function parseSocial() {
    setLoading(true);
    setError("");
    try {
      const links = linksInput
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 5);

      const response = await fetch("/api/social/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: socialInput.slice(0, 3000),
          links
        })
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : { hints: [], ambiguous: [] };
      if (!response.ok) {
        setError(data.error || "Failed to parse social input.");
      }
      setParseResult(data);
      if (data.resolved) {
        setSuggestions([data.resolved]);
      }
    } catch {
      setError("Failed to parse social input.");
    } finally {
      setLoading(false);
    }
  }

  function goToPlace(placeId: string) {
    router.push(`/place/${placeId}`);
  }

  return (
    <Card className="space-y-8 rounded-3xl border-border p-6 shadow-sm md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Try the parser</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">Bring one travel idea in and see how Pave reads it.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a few links, add the caption context, and we’ll surface the destination signal so you can decide
              whether to open place context or move straight into the full create flow.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Search city, landmark, or venue</label>
            <div className="theme-input-shell flex items-center gap-2 px-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                className="border-0 px-0 focus:ring-0"
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Try: Lisbon, Kyoto, Accra, Lower Manhattan"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Social links (1-5)</label>
            <Textarea
              className="min-h-20 rounded-xl"
              value={linksInput}
              onChange={(e) => setLinksInput(e.target.value)}
              placeholder="Paste links (one per line)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Caption or notes</label>
            <Textarea
              className="min-h-28 rounded-xl"
              value={socialInput}
              onChange={(e) => setSocialInput(e.target.value)}
              placeholder="Three friends landing in Lisbon Friday afternoon, want food spots, walkable neighborhoods, and a couple of local places we can publish later..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl px-4 font-bold" type="button" onClick={parseSocial} disabled={!socialInput.trim() || loading}>
              <Wand2 className="mr-2 h-4 w-4" />
              {loading ? "Parsing..." : "Parse the signal"}
            </Button>
            <Button
              className="rounded-xl px-4 font-bold"
              type="button"
              variant="outline"
              disabled={!canBuild}
              onClick={() => suggestions[0] && goToPlace(suggestions[0].placeId)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Open place context
            </Button>
            <Button className="rounded-xl px-4 font-bold" type="button" variant="ghost" onClick={() => router.push("/create")}>
              Continue to the full create flow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-muted/70 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Signal preview</h3>

          {parseResult?.hints?.length ? (
            <div className="flex flex-wrap gap-2">
              {parseResult.hints.map((hint) => (
                <span key={hint} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {hint}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Once you parse the source material, we’ll show the location hints we can actually work with.</p>
          )}

          {parseResult?.ambiguous?.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Confirm intended location</p>
              {parseResult.ambiguous.map((s) => (
                <button
                  key={s.placeId}
                  className="block w-full rounded-xl border border-border bg-card px-3 py-2 text-left text-sm font-medium text-foreground hover:border-primary hover:text-primary"
                  onClick={() => goToPlace(s.placeId)}
                  type="button"
                >
                  {s.text}
                </button>
              ))}
            </div>
          ) : null}

          {suggestions.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Suggestions</p>
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  className="block w-full rounded-xl border border-border bg-card px-3 py-2 text-left text-sm font-medium text-foreground hover:border-primary hover:text-primary"
                  onClick={() => goToPlace(s.placeId)}
                  type="button"
                >
                  {s.text}
                </button>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl bg-card p-3 shadow-sm">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Good input wins
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mention vibe words like “budget”, “quiet”, “food”, “nightlife”, or “walkable” so the next step has better
              structure to work from and the eventual itinerary feels less generic.
            </p>
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </Card>
  );
}
