import { env } from "@/lib/env";
import { GooglePlacesProvider } from "@/lib/providers/google-places";
import { MockPlacesProvider } from "@/lib/providers/mock-places";
import type { NearbySearchInput } from "@/lib/types";

const NEARBY_CACHE_KEY_VERSION = "v2";

export function buildNearbyCacheKey(input: NearbySearchInput) {
  return [
    NEARBY_CACHE_KEY_VERSION,
    input.lat.toFixed(4),
    input.lng.toFixed(4),
    input.type,
    input.radiusMeters,
    input.minPrice ?? "na",
    input.maxPrice ?? "na"
  ].join(":");
}

export const mockPlacesProviderEnabled = env.USE_MOCK_PLACES_PROVIDER;

export const placesProvider = mockPlacesProviderEnabled ? new MockPlacesProvider() : new GooglePlacesProvider();
