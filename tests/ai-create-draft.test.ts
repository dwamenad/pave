import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    ENABLE_AI_CREATE: false,
    OPENAI_API_KEY: "",
    OPENAI_RESPONSES_MODEL: "gpt-4.1-mini"
  }
}));

import { generateAiTripDraft } from "@/lib/server/ai/draft";

const fallbackDraft = {
  title: "Fallback Social Plan",
  summary: "Recovered from the deterministic fallback generator.",
  destination: {
    placeId: "dest_lisbon",
    name: "Lisbon",
    lat: 38.7223,
    lng: -9.1393,
    address: "Lisbon, Portugal",
    photoUrl: null
  },
  days: [
    {
      dayIndex: 1,
      title: "Arrival",
      summary: "Walkable anchor stops near the center.",
      items: [
        {
          placeId: "eat_1",
          category: "eat",
          name: "Time Out Market",
          rationale: "Reliable opening stop with strong food variety.",
          notes: null
        }
      ]
    }
  ]
} as const;

const destination = {
  placeId: "dest_lisbon",
  name: "Lisbon",
  lat: 38.7223,
  lng: -9.1393,
  address: "Lisbon, Portugal",
  photoUrl: null,
  types: ["locality"],
  rating: 4.8,
  userRatingsTotal: 1000
};

const nearbyPlaces = [
  {
    placeId: "do_1",
    name: "Miradouro",
    lat: 38.713,
    lng: -9.14,
    address: "Viewpoint",
    photoUrl: null,
    types: ["tourist_attraction"],
    rating: 4.7,
    userRatingsTotal: 400
  },
  {
    placeId: "eat_1",
    name: "Time Out Market",
    lat: 38.707,
    lng: -9.145,
    address: "Food hall",
    photoUrl: null,
    types: ["restaurant"],
    rating: 4.6,
    userRatingsTotal: 500
  }
] as const;

function buildDeps(options?: {
  enableAi?: boolean;
  apiKey?: string;
  knowledgeTool?: Record<string, unknown> | null;
  runResponseImpl?: (input: {
    onFunctionCall: (call: { name: string; arguments: string }) => Promise<unknown>;
  }) => Promise<{
    model: string;
    toolCount: number;
    retrievalUsed: boolean;
    outputText: string;
  }>;
}) {
  return {
    env: {
      ENABLE_AI_CREATE: options?.enableAi ?? true,
      OPENAI_API_KEY: options?.apiKey ?? "test-key",
      OPENAI_RESPONSES_MODEL: "gpt-4.1-mini"
    },
    placeDetails: async (placeId: string) => {
      if (placeId === destination.placeId) return destination;
      return nearbyPlaces.find((place) => place.placeId === placeId) ?? destination;
    },
    buildFallbackTripDraft: async () => fallbackDraft,
    getAiKnowledgeTool: () => options?.knowledgeTool ?? null,
    getAiCreateToolDefinitions: () => [
      { type: "function", name: "get_place_details" },
      { type: "function", name: "search_nearby_places" },
      { type: "function", name: "get_user_context" }
    ],
    executeAiCreateToolCall: async ({
      name,
      rawArguments,
      context
    }: {
      name: string;
      rawArguments: string;
      context: { knownPlaces: Map<string, (typeof destination) | (typeof nearbyPlaces)[number]> };
    }) => {
      const args = rawArguments ? JSON.parse(rawArguments) : {};

      if (name === "get_place_details") {
        const place = args.placeId === destination.placeId ? destination : nearbyPlaces.find((item) => item.placeId === args.placeId) ?? destination;
        context.knownPlaces.set(place.placeId, place);
        return place;
      }

      if (name === "search_nearby_places") {
        for (const place of nearbyPlaces) {
          context.knownPlaces.set(place.placeId, place);
        }

        return {
          category: args.category,
          results: nearbyPlaces
        };
      }

      return null;
    },
    runResponseWithTools: async (input: { onFunctionCall: (call: { name: string; arguments: string }) => Promise<unknown> }) => {
      if (options?.runResponseImpl) {
        return options.runResponseImpl(input);
      }

      await input.onFunctionCall({
        name: "search_nearby_places",
        arguments: JSON.stringify({
          lat: destination.lat,
          lng: destination.lng,
          category: "do",
          budget: "mid",
          pace: "balanced",
          limit: 1
        })
      });

      await input.onFunctionCall({
        name: "search_nearby_places",
        arguments: JSON.stringify({
          lat: destination.lat,
          lng: destination.lng,
          category: "eat",
          budget: "mid",
          pace: "balanced",
          limit: 1
        })
      });

      return {
        model: "gpt-4.1-mini",
        toolCount: 2,
        retrievalUsed: false,
        outputText: JSON.stringify({
          title: "Lisbon Social Plan",
          summary: "Balanced city break tuned for food and views.",
          destination: {
            placeId: destination.placeId,
            name: destination.name,
            lat: destination.lat,
            lng: destination.lng
          },
          days: [
            {
              dayIndex: 1,
              title: "Arrival and views",
              summary: "Keep the first day compact near the center.",
              items: [
                {
                  placeId: "do_1",
                  category: "do",
                  name: "Miradouro",
                  rationale: "Strong scenic opener."
                },
                {
                  placeId: "eat_1",
                  category: "eat",
                  name: "Time Out Market",
                  rationale: "Reliable food stop with broad appeal."
                }
              ]
            },
            {
              dayIndex: 2,
              title: "Market loop",
              summary: "Finish with another walkable food circuit.",
              items: [
                {
                  placeId: "eat_1",
                  category: "eat",
                  name: "Time Out Market",
                  rationale: "Intentional duplicate to test guardrails."
                }
              ]
            }
          ]
        })
      };
    }
  };
}

describe("generateAiTripDraft", () => {
  it("returns deterministic fallback when AI is disabled", async () => {
    const result = await generateAiTripDraft(
      {
        request: {
          caption: "Weekend in Lisbon",
          links: [],
          selectedPlaceId: destination.placeId,
          preferences: {
            budget: "mid",
            days: 1,
            pace: "balanced",
            vibeTags: ["food"],
            dietary: []
          }
        },
        requesterUserId: null
      },
      buildDeps({
        enableAi: false,
        apiKey: ""
      })
    );

    expect(result.generationMode).toBe("fallback");
    expect(result.fallbackReason).toBe("ai_disabled");
    expect(result.draft.title).toBe(fallbackDraft.title);
  });

  it("falls back when the model output violates duplicate-place guardrails", async () => {
    const result = await generateAiTripDraft(
      {
        request: {
          caption: "Weekend in Lisbon",
          links: [],
          selectedPlaceId: destination.placeId,
          preferences: {
            budget: "mid",
            days: 2,
            pace: "balanced",
            vibeTags: ["food"],
            dietary: []
          }
        },
        requesterUserId: "user_1"
      },
      buildDeps()
    );

    expect(result.generationMode).toBe("fallback");
    expect(result.fallbackReason).toBe("duplicate_places");
  });

  it("degrades to tools-only mode when retrieval is unavailable and still returns an AI draft", async () => {
    const result = await generateAiTripDraft(
      {
        request: {
          caption: "Weekend in Lisbon",
          links: [],
          selectedPlaceId: destination.placeId,
          preferences: {
            budget: "mid",
            days: 1,
            pace: "balanced",
            vibeTags: ["food"],
            dietary: []
          }
        },
        requesterUserId: "user_1"
      },
      buildDeps({
        knowledgeTool: null,
        runResponseImpl: async ({ onFunctionCall }) => {
          await onFunctionCall({
            name: "search_nearby_places",
            arguments: JSON.stringify({
              lat: destination.lat,
              lng: destination.lng,
              category: "do",
              budget: "mid",
              pace: "balanced",
              limit: 1
            })
          });

          return {
            model: "gpt-4.1-mini",
            toolCount: 1,
            retrievalUsed: false,
            outputText: JSON.stringify({
              title: "Lisbon Social Plan",
              summary: "Balanced city break tuned for food and views.",
              destination: {
                placeId: destination.placeId,
                name: destination.name,
                lat: destination.lat,
                lng: destination.lng
              },
              days: [
                {
                  dayIndex: 1,
                  title: "Arrival and views",
                  summary: "Keep the first day compact near the center.",
                  items: [
                    {
                      placeId: "do_1",
                      category: "do",
                      name: "Miradouro",
                      rationale: "Strong scenic opener."
                    }
                  ]
                }
              ]
            })
          };
        }
      })
    );

    expect(result.generationMode).toBe("ai");
    expect(result.telemetry.retrievalUsed).toBe(false);
    expect(result.draft.days).toHaveLength(1);
  });

  it("falls back when the model call throws", async () => {
    const result = await generateAiTripDraft(
      {
        request: {
          caption: "Weekend in Lisbon",
          links: [],
          selectedPlaceId: destination.placeId,
          preferences: {
            budget: "mid",
            days: 1,
            pace: "balanced",
            vibeTags: ["food"],
            dietary: []
          }
        },
        requesterUserId: "user_1"
      },
      buildDeps({
        runResponseImpl: async () => {
          throw new Error("boom");
        }
      })
    );

    expect(result.generationMode).toBe("fallback");
    expect(result.fallbackReason).toBe("model_error");
  });
});
