export type AiDraftFallbackReason =
  | "ai_disabled"
  | "missing_place"
  | "provider_unavailable"
  | "model_timeout"
  | "model_error"
  | "invalid_output"
  | "duplicate_places"
  | "unresolved_places"
  | "policy_invalid";

export type CreateTripFromDraftFailureCode =
  | "draft_day_mismatch"
  | "duplicate_places"
  | "too_many_stays"
  | "destination_unresolved"
  | "place_unresolved"
  | "provider_unavailable";

export type SocialParseFailureCode =
  | "invalid_input"
  | "rate_limited"
  | "provider_misconfigured"
  | "provider_unavailable"
  | "invalid_request";

export type ExportFailureCode =
  | "unauthorized"
  | "rate_limited"
  | "trip_not_found"
  | "export_failed";

export type AiCreatePreferences = {
  budget: "budget" | "mid" | "luxury";
  days: 1 | 2 | 3;
  pace: "slow" | "balanced" | "packed";
  vibeTags: string[];
  dietary: string[];
};

export type AiTripDraftItem = {
  placeId: string;
  category: "eat" | "stay" | "do";
  name: string;
  rationale: string;
  notes?: string | null;
};

export type AiTripDraftDay = {
  dayIndex: number;
  title: string;
  summary: string;
  items: AiTripDraftItem[];
};

export type AiTripDraft = {
  title: string;
  summary: string;
  destination: {
    placeId: string;
    name: string;
    lat: number;
    lng: number;
    address?: string | null;
    photoUrl?: string | null;
  };
  days: AiTripDraftDay[];
};

export type AiTripDraftRequest = {
  caption: string;
  links: string[];
  selectedPlaceId: string;
  preferences: AiCreatePreferences;
};

export type AiTripDraftResponse = {
  generationMode: "ai" | "fallback";
  fallbackReason?: AiDraftFallbackReason;
  draft: AiTripDraft;
  telemetry: {
    model: string;
    latencyMs: number;
    toolCount: number;
    retrievalUsed: boolean;
    signedIn: boolean;
  };
  provider?: {
    reasonCode?: string;
    cacheState: "hit" | "stale" | "miss";
    mockMode: boolean;
  };
};

export type CreateTripFromDraftRequest = {
  draft: AiTripDraft;
  preferences: AiCreatePreferences;
  editedBeforeSave?: boolean;
};
