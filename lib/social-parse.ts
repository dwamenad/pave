import { placesProvider } from "@/lib/providers";
import type { PlaceSuggestion } from "@/lib/types";

const hintRegexes = [
  /\b(?:in|at|near)\s+([A-Z][a-zA-Z\s]{2,40})/g,
  /#([A-Za-z]{3,30})/g,
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g
];

function extractHints(text: string) {
  const hints = new Set<string>();
  for (const regex of hintRegexes) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const value = (match[1] || "").trim();
      if (value.length >= 3) hints.add(value);
    }
  }
  return Array.from(hints).slice(0, 8);
}

export async function parseSocialIntent(input: string, metadataTexts: string[] = []): Promise<{
  hints: string[];
  resolved?: PlaceSuggestion;
  ambiguous: PlaceSuggestion[];
}> {
  const hints = extractHints([input, ...metadataTexts].join(" "));
  const direct = hints[0] || input.trim();
  if (!direct) {
    return { hints: [], ambiguous: [] };
  }

  const suggestions = await placesProvider.autocomplete(direct);
  if (suggestions.length === 1) {
    return { hints, resolved: suggestions[0], ambiguous: [] };
  }

  return {
    hints,
    resolved: undefined,
    ambiguous: suggestions.slice(0, 5)
  };
}
