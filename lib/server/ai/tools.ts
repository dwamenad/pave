import { db } from "@/lib/db";
import { budgetToPriceRange, CATEGORY_TYPES, pickTopPlaces } from "@/lib/itinerary";
import { placesProvider } from "@/lib/providers";
import type { AiCreatePreferences } from "@pave/contracts";
import type { HubCategory, PlaceDetails } from "@/lib/types";

export type AiCreateToolName = "get_place_details" | "search_nearby_places" | "get_user_context";

export type AiCreateToolContext = {
  userId?: string | null;
  knownPlaces: Map<string, PlaceDetails>;
};

function clampRadiusMeters(pace: AiCreatePreferences["pace"], requested?: number) {
  const defaultRadius = pace === "slow" ? 2800 : pace === "packed" ? 5000 : 4000;
  if (!requested) return defaultRadius;
  return Math.max(800, Math.min(8000, Math.round(requested)));
}

export function getAiCreateToolDefinitions() {
  return [
    {
      type: "function",
      name: "get_place_details",
      description: "Get canonical details for a destination or candidate place by placeId.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["placeId"],
        properties: {
          placeId: {
            type: "string",
            description: "Canonical Google place ID."
          }
        }
      }
    },
    {
      type: "function",
      name: "search_nearby_places",
      description: "Search real nearby places for a category, budget, and pace. Use this to gather itinerary candidates.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["lat", "lng", "category"],
        properties: {
          lat: { type: "number" },
          lng: { type: "number" },
          category: { type: "string", enum: ["eat", "stay", "do"] },
          budget: { type: "string", enum: ["budget", "mid", "luxury"] },
          pace: { type: "string", enum: ["slow", "balanced", "packed"] },
          radiusMeters: { type: "integer", minimum: 800, maximum: 8000 },
          limit: { type: "integer", minimum: 1, maximum: 8 }
        }
      }
    },
    {
      type: "function",
      name: "get_user_context",
      description: "Fetch lightweight personalization signals for the signed-in requester only. Returns null for guests.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {}
      }
    }
  ];
}

async function getPlaceDetailsTool(args: { placeId: string }, context: AiCreateToolContext) {
  const place = await placesProvider.placeDetails(args.placeId);
  context.knownPlaces.set(place.placeId, place);
  return place;
}

async function searchNearbyPlacesTool(
  args: {
    lat: number;
    lng: number;
    category: HubCategory;
    budget?: AiCreatePreferences["budget"];
    pace?: AiCreatePreferences["pace"];
    radiusMeters?: number;
    limit?: number;
  },
  context: AiCreateToolContext
) {
  const budget = args.budget || "mid";
  const pace = args.pace || "balanced";
  const radiusMeters = clampRadiusMeters(pace, args.radiusMeters);
  const limit = Math.max(1, Math.min(8, args.limit || 6));
  const types = CATEGORY_TYPES[args.category];
  const price = budgetToPriceRange(budget);

  let merged: PlaceDetails[] = [];
  for (const type of types.slice(0, 3)) {
    const results = await placesProvider.nearbySearch({
      lat: args.lat,
      lng: args.lng,
      type,
      radiusMeters,
      ...price
    });
    merged = merged.concat(results);
  }

  const deduped = Array.from(new Map(merged.map((place) => [place.placeId, place])).values());
  const ranked = pickTopPlaces(deduped, args.lat, args.lng, limit);
  for (const place of ranked) {
    context.knownPlaces.set(place.placeId, place);
  }

  return {
    category: args.category,
    radiusMeters,
    results: ranked.map((place) => ({
      placeId: place.placeId,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      priceLevel: place.priceLevel,
      address: place.address,
      photoUrl: place.photoUrl,
      rationale: place.rationale
    }))
  };
}

async function getUserContextTool(context: AiCreateToolContext) {
  if (!context.userId) return null;

  const user = await db.user.findUnique({
    where: { id: context.userId },
    select: {
      id: true,
      preferences: true,
      authoredTrips: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          placeId: true,
          centerLat: true,
          centerLng: true,
          days: {
            select: { dayIndex: true },
            orderBy: { dayIndex: "asc" }
          }
        }
      },
      postSaves: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          post: {
            select: {
              destinationLabel: true,
              tags: true,
              trip: {
                select: {
                  title: true,
                  placeId: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  return {
    preferences: user.preferences ?? null,
    recentTrips: user.authoredTrips.map((trip) => ({
      title: trip.title,
      placeId: trip.placeId,
      centerLat: trip.centerLat,
      centerLng: trip.centerLng,
      daysCount: trip.days.length
    })),
    savedPosts: user.postSaves.map((save) => ({
      destinationLabel: save.post.destinationLabel,
      tags: save.post.tags,
      tripTitle: save.post.trip.title,
      placeId: save.post.trip.placeId
    }))
  };
}

export async function executeAiCreateToolCall(input: {
  name: string;
  rawArguments: string;
  context: AiCreateToolContext;
}) {
  const parsed = input.rawArguments ? JSON.parse(input.rawArguments) : {};

  switch (input.name as AiCreateToolName) {
    case "get_place_details":
      return getPlaceDetailsTool(parsed as { placeId: string }, input.context);
    case "search_nearby_places":
      return searchNearbyPlacesTool(
        parsed as {
          lat: number;
          lng: number;
          category: HubCategory;
          budget?: AiCreatePreferences["budget"];
          pace?: AiCreatePreferences["pace"];
          radiusMeters?: number;
          limit?: number;
        },
        input.context
      );
    case "get_user_context":
      return getUserContextTool(input.context);
    default:
      throw new Error(`Unsupported AI tool call: ${input.name}`);
  }
}
