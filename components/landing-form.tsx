"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    <Card className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">One Click Away</h1>
        <p className="text-sm text-muted-foreground">Turn a social post into a ready-to-use trip plan.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Search city, landmark, or venue</label>
        <Input value={query} onChange={(e) => onSearchChange(e.target.value)} placeholder="Try: Eiffel Tower, Accra, NYC" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Paste 1-5 social links or caption text</label>
        <Textarea
          value={linksInput}
          onChange={(e) => setLinksInput(e.target.value)}
          placeholder="Paste social links (one per line)"
        />
        <Textarea
          value={socialInput}
          onChange={(e) => setSocialInput(e.target.value)}
          placeholder="Paste Instagram/TikTok/YouTube links or text like: best coffee in Paris near Eiffel Tower"
        />
        <Button type="button" variant="outline" onClick={parseSocial} disabled={!socialInput.trim() || loading}>
          {loading ? "Parsing..." : "Parse location hints"}
        </Button>
      </div>

      {parseResult?.hints?.length ? (
        <p className="text-xs text-muted-foreground">Detected hints: {parseResult.hints.join(", ")}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {parseResult?.ambiguous?.length ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Confirm intended location</p>
          {parseResult.ambiguous.map((s) => (
            <button
              key={s.placeId}
              className="block w-full rounded border px-3 py-2 text-left text-sm hover:bg-muted"
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
          <p className="text-sm font-medium">Suggestions</p>
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              className="block w-full rounded border px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => goToPlace(s.placeId)}
              type="button"
            >
              {s.text}
            </button>
          ))}
        </div>
      ) : null}

      <Button type="button" disabled={!canBuild} onClick={() => suggestions[0] && goToPlace(suggestions[0].placeId)}>
        Build my plan
      </Button>
    </Card>
  );
}
