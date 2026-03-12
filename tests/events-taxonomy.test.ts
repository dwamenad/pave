import { describe, expect, it } from "vitest";
import { TRACKED_EVENT_NAMES, isTrackedEventName } from "@/lib/event-taxonomy";

describe("event taxonomy", () => {
  it("contains the required funnel events", () => {
    const required = [
      "start_create_flow",
      "complete_parse_social",
      "complete_trip_create",
      "view_feed",
      "view_post",
      "save_post",
      "remix_trip",
      "publish_post",
      "share_trip",
      "comment_post",
      "follow_user",
      "invite_collaborator",
      "web_runtime_error",
      "server_exception"
    ];

    for (const eventName of required) {
      expect(TRACKED_EVENT_NAMES).toContain(eventName);
    }
  });

  it("validates event names consistently", () => {
    expect(isTrackedEventName("view_feed")).toBe(true);
    expect(isTrackedEventName(" VIEW_FEED ")).toBe(true);
    expect(isTrackedEventName("custom_random_event")).toBe(false);
    expect(isTrackedEventName("")).toBe(false);
  });
});
