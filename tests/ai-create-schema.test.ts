import { describe, expect, it } from "vitest";
import { aiCreateEvalFixtures } from "@/tests/fixtures/ai-create";
import { aiTripDraftSchema, validateResolvedDraft } from "@/lib/server/ai/schema";

describe("ai create draft schema", () => {
  it("rejects malformed draft payloads", () => {
    expect(() =>
      aiTripDraftSchema.parse({
        title: "x",
        summary: "short",
        destination: {
          placeId: "dest_1",
          name: "Lisbon"
        },
        days: []
      })
    ).toThrow();
  });

  it("flags duplicate and unresolved place ids", () => {
    const draft = aiTripDraftSchema.parse({
      title: "Lisbon Social Plan",
      summary: "Balanced city break tuned for food and views.",
      destination: {
        placeId: "dest_lisbon",
        name: "Lisbon",
        lat: 38.7223,
        lng: -9.1393
      },
      days: [
        {
          dayIndex: 1,
          title: "Arrival",
          summary: "Keep the route tight near the center.",
          items: [
            {
              placeId: "eat_1",
              category: "eat",
              name: "Bakery One",
              rationale: "Strong first stop close to the hotel."
            },
            {
              placeId: "eat_1",
              category: "eat",
              name: "Bakery One",
              rationale: "Repeated on purpose for validation."
            }
          ]
        }
      ]
    });

    const duplicateResult = validateResolvedDraft({
      draft,
      expectedDays: 1,
      destinationPlaceId: "dest_lisbon",
      allowedPlaceIds: new Set(["dest_lisbon", "eat_1"])
    });
    expect(duplicateResult.ok).toBe(false);
    if (duplicateResult.ok) throw new Error("expected duplicate validation failure");
    expect(duplicateResult.reason).toBe("duplicate_places");

    const unresolvedDraft = aiTripDraftSchema.parse({
      ...draft,
      days: [
        {
          ...draft.days[0],
          items: [
            {
              placeId: "eat_2",
              category: "eat",
              name: "Cafe Two",
              rationale: "Only appears in invalid output."
            }
          ]
        }
      ]
    });

    const unresolvedResult = validateResolvedDraft({
      draft: unresolvedDraft,
      expectedDays: 1,
      destinationPlaceId: "dest_lisbon",
      allowedPlaceIds: new Set(["dest_lisbon", "eat_1"])
    });
    expect(unresolvedResult.ok).toBe(false);
    if (unresolvedResult.ok) throw new Error("expected unresolved validation failure");
    expect(unresolvedResult.reason).toBe("unresolved_places");
  });

  it("keeps the fixed eval fixture set complete", () => {
    expect(aiCreateEvalFixtures).toHaveLength(5);
    expect(aiCreateEvalFixtures.map((fixture) => fixture.key)).toEqual([
      "solo-foodie-weekend",
      "couple-luxury-city-break",
      "mixed-group-trip",
      "packed-budget-trip",
      "slow-culture-trip"
    ]);
  });
});
