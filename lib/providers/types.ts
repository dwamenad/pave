import type { NearbySearchInput, PlaceDetails, PlaceSuggestion } from "@/lib/types";

export type PlacesProviderReasonCode =
  | "provider_unavailable"
  | "provider_misconfigured"
  | "rate_limited"
  | "invalid_request"
  | "no_results";

export class PlacesProviderError extends Error {
  code: PlacesProviderReasonCode;
  status?: number;

  constructor(code: PlacesProviderReasonCode, message: string, options?: { status?: number }) {
    super(message);
    this.code = code;
    this.status = options?.status;
    this.name = "PlacesProviderError";
  }
}

export interface PlacesProvider {
  autocomplete(query: string, sessionToken?: string): Promise<PlaceSuggestion[]>;
  placeDetails(placeId: string): Promise<PlaceDetails>;
  nearbySearch(input: NearbySearchInput): Promise<PlaceDetails[]>;
}
