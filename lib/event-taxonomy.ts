export const TRACKED_EVENT_NAMES = [
  "view_feed",
  "view_post",
  "save_post",
  "remix_trip",
  "publish_post",
  "share_trip",
  "comment_post",
  "follow_user",
  "mobile_error",
  "ai_draft_requested",
  "ai_draft_completed",
  "ai_draft_fallback",
  "ai_draft_accepted",
  "ai_draft_rejected"
] as const;

export type TrackedEventName = (typeof TRACKED_EVENT_NAMES)[number];

const TRACKED_EVENT_SET = new Set<string>(TRACKED_EVENT_NAMES);

export function isTrackedEventName(name: string) {
  return TRACKED_EVENT_SET.has(name.trim().toLowerCase());
}
