import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlacesProviderError } from "@/lib/providers/types";

const { mockedProvider, mockedCache } = vi.hoisted(() => ({
  mockedProvider: {
    autocomplete: vi.fn(),
    placeDetails: vi.fn(),
    nearbySearch: vi.fn()
  },
  mockedCache: {
    getPlaceCache: vi.fn(),
    setPlaceCache: vi.fn(),
    getNearbyCache: vi.fn(),
    setNearbyCache: vi.fn()
  }
}));

vi.mock("@/lib/providers", () => ({
  placesProvider: mockedProvider,
  buildNearbyCacheKey: (input: { type: string }) => `v2:${input.type}`,
  mockPlacesProviderEnabled: false
}));

vi.mock("@/lib/server/cache", () => mockedCache);

import { autocompletePlaces, getPlaceDetails, searchNearbyPlaces } from "@/lib/server/place-service";

describe("place service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached place details as a hit without calling the provider", async () => {
    mockedCache.getPlaceCache.mockResolvedValue({
      value: { placeId: "dest_lisbon", name: "Lisbon", lat: 1, lng: 2, types: [] },
      cacheState: "hit",
      fetchedAt: "2026-03-11T10:00:00.000Z"
    });

    const result = await getPlaceDetails("dest_lisbon");

    expect(result.ok).toBe(true);
    expect(result.cacheState).toBe("hit");
    expect(result.data?.placeId).toBe("dest_lisbon");
    expect(mockedProvider.placeDetails).not.toHaveBeenCalled();
  });

  it("serves stale place details when the provider fails after cache expiry", async () => {
    mockedCache.getPlaceCache.mockResolvedValue({
      value: { placeId: "dest_lisbon", name: "Lisbon", lat: 1, lng: 2, types: [] },
      cacheState: "stale",
      fetchedAt: "2026-03-10T10:00:00.000Z"
    });
    mockedProvider.placeDetails.mockRejectedValue(new PlacesProviderError("provider_unavailable", "down"));

    const result = await getPlaceDetails("dest_lisbon");

    expect(result.ok).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.stale).toBe(true);
    expect(result.reasonCode).toBe("provider_unavailable");
    expect(result.cacheState).toBe("stale");
  });

  it("returns no_results for successful nearby searches with no matches", async () => {
    mockedCache.getNearbyCache.mockResolvedValue({ value: null, cacheState: "miss", fetchedAt: null });
    mockedProvider.nearbySearch.mockResolvedValue([]);

    const result = await searchNearbyPlaces({ lat: 1, lng: 2, type: "restaurant", radiusMeters: 1000 });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.reasonCode).toBe("no_results");
    expect(mockedCache.setNearbyCache).toHaveBeenCalled();
  });

  it("maps autocomplete provider failures to a service result envelope", async () => {
    mockedProvider.autocomplete.mockRejectedValue(new PlacesProviderError("rate_limited", "later"));

    const result = await autocompletePlaces("Tokyo");

    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("rate_limited");
    expect(result.cacheState).toBe("miss");
  });
});
