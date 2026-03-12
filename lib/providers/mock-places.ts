import { getMockNearbyResults, getMockPlaceById, searchMockPlaces } from "@/lib/mock/place-fixtures";
import type { PlacesProvider } from "@/lib/providers/types";
import { PlacesProviderError } from "@/lib/providers/types";
import type { NearbySearchInput } from "@/lib/types";

export class MockPlacesProvider implements PlacesProvider {
  async autocomplete(query: string) {
    return searchMockPlaces(query);
  }

  async placeDetails(placeId: string) {
    const place = getMockPlaceById(placeId);
    if (!place) {
      throw new PlacesProviderError("no_results", `Mock place not found for ${placeId}`);
    }
    return place;
  }

  async nearbySearch(input: NearbySearchInput) {
    return getMockNearbyResults(input);
  }
}
