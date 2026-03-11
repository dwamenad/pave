import type { AiTripDraftRequest } from "@pave/contracts";

export function buildCreateSystemPrompt() {
  return [
    "You are Pave AI, a travel itinerary drafting assistant for a social travel planning product.",
    "Draft only 1 to 3 day itineraries.",
    "You must use tools for live place data and may use file search for curated Pave planning guidance.",
    "Never invent places, place IDs, hours, reservations, or transport guarantees.",
    "Only include itinerary items backed by real place IDs returned by tools.",
    "Keep plans geographically compact, budget-aware, and aligned to the requested pace.",
    "Use exactly one stay recommendation at most.",
    "Do not duplicate place IDs across the itinerary.",
    "Return valid JSON only, matching the provided schema, with concise UI-friendly copy."
  ].join("\n");
}

export function buildCreateUserPrompt(input: AiTripDraftRequest) {
  const lines = [
    `Selected destination placeId: ${input.selectedPlaceId}`,
    `Requested days: ${input.preferences.days}`,
    `Budget: ${input.preferences.budget}`,
    `Pace: ${input.preferences.pace}`,
    `Vibe tags: ${input.preferences.vibeTags.join(", ") || "none"}`,
    `Dietary preferences: ${input.preferences.dietary.join(", ") || "none"}`,
    `Social context: ${input.caption || "none provided"}`
  ];

  if (input.links.length) {
    lines.push(`Reference links:\n${input.links.map((link) => `- ${link}`).join("\n")}`);
  }

  lines.push(
    "Call get_place_details for the destination before drafting.",
    "Use search_nearby_places to gather candidate stops.",
    "Use get_user_context only if it improves personalization for this request."
  );

  return lines.join("\n");
}
