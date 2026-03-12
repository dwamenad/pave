import { buildNearbyCacheKey, mockPlacesProviderEnabled, placesProvider } from "@/lib/providers";
import { PlacesProviderError, type PlacesProviderReasonCode } from "@/lib/providers/types";
import { getNearbyCache, getPlaceCache, setNearbyCache, setPlaceCache, type CacheState } from "@/lib/server/cache";
import type { NearbySearchInput, PlaceDetails, PlaceSuggestion } from "@/lib/types";

export type PlaceServiceReasonCode = PlacesProviderReasonCode | "unknown_error";

export type PlaceServiceResult<T> = {
  ok: boolean;
  data: T | null;
  degraded: boolean;
  stale: boolean;
  cacheState: CacheState;
  fetchedAt: string | null;
  reasonCode?: PlaceServiceReasonCode;
  mockMode: boolean;
};

function toReasonCode(error: unknown): PlaceServiceReasonCode {
  if (error instanceof PlacesProviderError) return error.code;
  return "unknown_error";
}

function successResult<T>(input: {
  data: T;
  cacheState?: CacheState;
  fetchedAt?: string | null;
  degraded?: boolean;
  stale?: boolean;
  reasonCode?: PlaceServiceReasonCode;
}): PlaceServiceResult<T> {
  return {
    ok: true,
    data: input.data,
    degraded: input.degraded ?? false,
    stale: input.stale ?? false,
    cacheState: input.cacheState ?? "miss",
    fetchedAt: input.fetchedAt ?? null,
    reasonCode: input.reasonCode,
    mockMode: mockPlacesProviderEnabled
  };
}

function failureResult<T>(input: {
  cacheState?: CacheState;
  fetchedAt?: string | null;
  reasonCode: PlaceServiceReasonCode;
  degraded?: boolean;
  stale?: boolean;
}): PlaceServiceResult<T> {
  return {
    ok: false,
    data: null,
    degraded: input.degraded ?? true,
    stale: input.stale ?? false,
    cacheState: input.cacheState ?? "miss",
    fetchedAt: input.fetchedAt ?? null,
    reasonCode: input.reasonCode,
    mockMode: mockPlacesProviderEnabled
  };
}

export async function autocompletePlaces(query: string, sessionToken?: string): Promise<PlaceServiceResult<PlaceSuggestion[]>> {
  try {
    const suggestions = await placesProvider.autocomplete(query, sessionToken);
    return successResult({
      data: suggestions,
      cacheState: "miss",
      reasonCode: suggestions.length ? undefined : "no_results"
    });
  } catch (error) {
    return failureResult({ reasonCode: toReasonCode(error), cacheState: "miss", fetchedAt: null });
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceServiceResult<PlaceDetails>> {
  const cached = await getPlaceCache<PlaceDetails>(placeId, 24);

  if (cached.cacheState === "hit" && cached.value) {
    return successResult({ data: cached.value, cacheState: "hit", fetchedAt: cached.fetchedAt });
  }

  try {
    const place = await placesProvider.placeDetails(placeId);
    await setPlaceCache(placeId, place);
    return successResult({ data: place, cacheState: "miss", fetchedAt: new Date().toISOString() });
  } catch (error) {
    const reasonCode = toReasonCode(error);
    if (cached.value) {
      return successResult({
        data: cached.value,
        cacheState: "stale",
        fetchedAt: cached.fetchedAt,
        degraded: true,
        stale: true,
        reasonCode
      });
    }

    return failureResult({ reasonCode, cacheState: cached.cacheState, fetchedAt: cached.fetchedAt });
  }
}

export async function searchNearbyPlaces(input: NearbySearchInput): Promise<PlaceServiceResult<PlaceDetails[]>> {
  const cacheKey = buildNearbyCacheKey(input);
  const cached = await getNearbyCache<PlaceDetails[]>(cacheKey, 6);

  if (cached.cacheState === "hit" && cached.value) {
    return successResult({ data: cached.value, cacheState: "hit", fetchedAt: cached.fetchedAt });
  }

  try {
    const places = await placesProvider.nearbySearch(input);
    await setNearbyCache(cacheKey, places);
    return successResult({
      data: places,
      cacheState: "miss",
      fetchedAt: new Date().toISOString(),
      reasonCode: places.length ? undefined : "no_results"
    });
  } catch (error) {
    const reasonCode = toReasonCode(error);
    if (cached.value) {
      return successResult({
        data: cached.value,
        cacheState: "stale",
        fetchedAt: cached.fetchedAt,
        degraded: true,
        stale: true,
        reasonCode
      });
    }

    return failureResult({ reasonCode, cacheState: cached.cacheState, fetchedAt: cached.fetchedAt });
  }
}

export async function requirePlaceDetails(placeId: string): Promise<PlaceServiceResult<PlaceDetails> & { ok: true; data: PlaceDetails }> {
  const result = await getPlaceDetails(placeId);
  if (!result.ok || !result.data) {
    throw new PlacesProviderError(
      result.reasonCode === "unknown_error" || !result.reasonCode ? "provider_unavailable" : result.reasonCode,
      `Unable to load place details for ${placeId}`
    );
  }
  return result as PlaceServiceResult<PlaceDetails> & { ok: true; data: PlaceDetails };
}
