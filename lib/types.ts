export type BudgetMode = "budget" | "mid" | "luxury";
export type HubCategory = "eat" | "stay" | "do";

export type PlaceCard = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  address?: string;
  photoUrl?: string;
  types: string[];
};

export type NearbySearchInput = {
  lat: number;
  lng: number;
  type: string;
  radiusMeters: number;
  minPrice?: number;
  maxPrice?: number;
};

export type PlaceSuggestion = {
  placeId: string;
  text: string;
};

export type PlaceDetails = PlaceCard;

export type ItineraryPick = PlaceCard & {
  rationale: string;
  score: number;
  distanceMeters: number;
};

export type PostVisibility = "PUBLIC" | "UNLISTED";
export type PostStatus = "ACTIVE" | "HIDDEN" | "DELETED";
export type ModerationStatus = "ACTIVE" | "HIDDEN" | "DELETED";
export type FeedSource = "FOLLOWING" | "FOR_YOU" | "TRENDING";

export type SourceLinkMetadata = {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  parsedHints: string[];
};

export type PreferenceInput = {
  budget: BudgetMode;
  days: number;
  pace: "slow" | "balanced" | "packed";
  vibeTags: string[];
  dietary: string[];
};

export type PostSummary = {
  id: string;
  caption: string;
  mediaUrl?: string | null;
  destinationLabel?: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
  };
  trip: {
    id: string;
    slug: string;
    title: string;
  };
  counts: {
    likes: number;
    saves: number;
    comments: number;
  };
  source?: FeedSource;
  score?: number;
  followedAuthor?: boolean;
};

export type CommentDTO = {
  id: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
  author: {
    id: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
  };
};

export type PostDetail = PostSummary & {
  sourceLinks: SourceLinkMetadata[];
  comments: CommentDTO[];
};

export type FeedRankFeatures = {
  ageHours: number;
  likes: number;
  saves: number;
  comments: number;
  remixCount: number;
  creatorAffinity: number;
  velocity: number;
  negativeSignal: number;
  blocked: boolean;
};

export type FeedRankResult = {
  postId: string;
  source: FeedSource;
  score: number;
  features: FeedRankFeatures;
};

export type ExperimentAssignment = {
  experimentKey: string;
  variant: "control" | "variant_a" | "variant_b";
  userId?: string;
  assignedAt: string;
};

export type RiskScore = {
  actorId?: string;
  ipHash?: string;
  score: number;
  reasons: string[];
};

export type NotificationDTO = {
  id: string;
  type: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};
