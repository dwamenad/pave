export type AiDraftFallbackReason =
  | "ai_disabled"
  | "missing_place"
  | "model_timeout"
  | "model_error"
  | "invalid_output"
  | "duplicate_places"
  | "unresolved_places"
  | "policy_invalid";

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
};

export type CreateTripFromDraftRequest = {
  draft: AiTripDraft;
  preferences: AiCreatePreferences;
  editedBeforeSave?: boolean;
};
