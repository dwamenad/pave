export type MobileAuthGoogleRequest = {
  idToken: string;
  platform: "ios" | "android";
  deviceName?: string;
  appVersion?: string;
};

export type MobileAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
  };
};

export type MobileRefreshRequest = {
  refreshToken: string;
};

export type MobileRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type MobileLogoutRequest = {
  refreshToken: string;
};

export type MobileLogoutResponse = {
  ok: true;
};

export type MobileMeResponse = {
  user: {
    id: string;
    email?: string | null;
    username?: string | null;
    name?: string | null;
    image?: string | null;
    bio?: string | null;
  };
};

export type MobileDeviceRegisterRequest = {
  installationId: string;
  platform: "ios" | "android";
  appVersion?: string;
  pushToken?: string;
  deviceName?: string;
};

export type MobileDeviceRegisterResponse = {
  deviceId: string;
};

export type MobileFeedSource = "FOR_YOU" | "FOLLOWING" | "TRENDING";

export type MobilePostSummary = {
  id: string;
  caption: string;
  mediaUrl?: string | null;
  destinationLabel?: string | null;
  visibility: "PUBLIC" | "UNLISTED";
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
    bio?: string | null;
  };
  trip: {
    id: string;
    slug: string;
    title: string;
    daysCount: number;
  };
  counts: {
    likes: number;
    saves: number;
    comments: number;
  };
  source?: MobileFeedSource;
  score?: number;
  followedAuthor?: boolean;
};

export type MobileFeedResponse = {
  source: MobileFeedSource;
  items: MobilePostSummary[];
  nextCursor: string | null;
};

export type MobileComment = {
  id: string;
  body: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  createdAt: string;
  author: {
    id: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
  };
};

export type MobilePostDetail = MobilePostSummary & {
  trip: MobilePostSummary["trip"] & {
    daysPreview: Array<{
      id: string;
      dayIndex: number;
      items: Array<{
        id: string;
        name: string;
        category: string;
        notes?: string | null;
      }>;
    }>;
  };
  sourceLinks: Array<{
    url: string;
    domain: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    parsedHints: string[];
  }>;
  comments: MobileComment[];
};

export type MobilePostDetailResponse = {
  post: MobilePostDetail;
};

export type MobileCommentsResponse = {
  comments: MobileComment[];
};

export type MobileCommentCreateResponse = {
  comment: MobileComment;
};

export type MobileToggleLikeResponse = {
  liked: boolean;
};

export type MobileToggleSaveResponse = {
  saved: boolean;
};

export type MobileProfileResponse = {
  tab: "posts" | "saved";
  user: {
    id: string;
    email?: string | null;
    username?: string | null;
    name?: string | null;
    image?: string | null;
    bio?: string | null;
    createdAt: string;
    stats: {
      posts: number;
      savedPosts: number;
      totalPlannedDays: number;
    };
  };
  posts: MobilePostSummary[];
  savedPosts: MobilePostSummary[];
  items: MobilePostSummary[];
  viewer: {
    follows: boolean;
    blocked: boolean;
  };
};
