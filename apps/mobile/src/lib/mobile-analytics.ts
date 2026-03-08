import { getOrCreateInstallationId } from "@/src/lib/secure-token-store";
import type { createMobileApiClient } from "@/src/lib/api-client";

type MobileTrackedEventName =
  | "view_feed"
  | "view_post"
  | "save_post"
  | "remix_trip"
  | "publish_post"
  | "share_trip"
  | "comment_post"
  | "follow_user"
  | "mobile_error";

type MobileApiClient = ReturnType<typeof createMobileApiClient>;

export async function trackMobileEvent(
  api: MobileApiClient,
  name: MobileTrackedEventName,
  props?: Record<string, unknown>
) {
  const sessionId = await getOrCreateInstallationId();
  await api
    .post("/api/events/batch", {
      events: [
        {
          name,
          sessionId,
          props: {
            ...props,
            client: "mobile"
          }
        }
      ]
    })
    .catch(() => null);
}

export async function trackMobileError(
  api: MobileApiClient,
  error: unknown,
  context?: Record<string, unknown>
) {
  const message = error instanceof Error ? error.message : String(error || "Unknown mobile error");
  await trackMobileEvent(api, "mobile_error", {
    message: message.slice(0, 500),
    ...context
  });
}
