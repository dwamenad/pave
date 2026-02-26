import type { NearbySearchInput, PlaceCard, PlaceDetails, PlaceSuggestion } from "@/lib/types";
import type { PlacesProvider } from "@/lib/providers/types";
import { env } from "@/lib/env";

const API_BASE = "https://places.googleapis.com/v1";

function toPhotoUrl(name: string) {
  return `/api/places/photo?name=${encodeURIComponent(name)}&maxHeightPx=240&maxWidthPx=240`;
}

function normalizePlace(p: any): PlaceCard {
  const location = p.location || p.geometry?.location || {};
  const displayName = p.displayName?.text || p.name || "Unknown";
  return {
    placeId: p.id || p.placeId || "",
    name: displayName,
    lat: location.latitude ?? location.lat ?? 0,
    lng: location.longitude ?? location.lng ?? 0,
    rating: p.rating,
    userRatingsTotal: p.userRatingCount || p.user_ratings_total,
    priceLevel: typeof p.priceLevel === "string" ? Number(p.priceLevel.replace("PRICE_LEVEL_", "")) - 1 : p.price_level,
    openNow: p.currentOpeningHours?.openNow ?? p.opening_hours?.open_now,
    address: p.formattedAddress || p.vicinity,
    photoUrl: p.photos?.[0]?.name ? toPhotoUrl(p.photos[0].name) : undefined,
    types: p.types ?? []
  };
}

async function placesFetch(path: string, init: RequestInit & { fieldMask?: string } = {}) {
  if (!env.GOOGLE_MAPS_API_KEY_SERVER) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY_SERVER");
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Goog-Api-Key", env.GOOGLE_MAPS_API_KEY_SERVER);
  if (init.fieldMask) {
    headers.set("X-Goog-FieldMask", init.fieldMask);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places API error: ${response.status} ${text}`);
  }

  return response.json();
}

export class GooglePlacesProvider implements PlacesProvider {
  async autocomplete(query: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
    const data = await placesFetch("/places:autocomplete", {
      method: "POST",
      fieldMask: "suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      body: JSON.stringify({
        input: query,
        sessionToken
      })
    });

    return (data.suggestions || [])
      .map((s: any) => ({
        placeId: s.placePrediction?.placeId,
        text: s.placePrediction?.text?.text
      }))
      .filter((s: PlaceSuggestion) => s.placeId && s.text);
  }

  async placeDetails(placeId: string): Promise<PlaceDetails> {
    const data = await placesFetch(`/places/${placeId}`, {
      method: "GET",
      fieldMask:
        "id,displayName,location,rating,userRatingCount,priceLevel,currentOpeningHours,formattedAddress,types,photos"
    });

    return normalizePlace(data);
  }

  async nearbySearch(input: NearbySearchInput): Promise<PlaceDetails[]> {
    const priceLevels =
      input.minPrice !== undefined && input.maxPrice !== undefined
        ? Array.from(
            new Set(
              Array.from(
                { length: input.maxPrice - input.minPrice + 1 },
                (_, index) => `PRICE_LEVEL_${input.minPrice! + index + 1}`
              )
            )
          )
        : undefined;

    const data = await placesFetch("/places:searchNearby", {
      method: "POST",
      fieldMask:
        "places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.formattedAddress,places.types,places.photos",
      body: JSON.stringify({
        includedTypes: [input.type],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: input.lat,
              longitude: input.lng
            },
            radius: input.radiusMeters
          }
        },
        priceLevels
      })
    });

    return (data.places || []).map(normalizePlace);
  }
}
