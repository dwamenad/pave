import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getOrCreateAnonymousSession } from "@/lib/server/session";
import type { FeedSource } from "@/lib/types";

const ALLOWED_EVENTS = new Set([
  "view_feed",
  "view_post",
  "save_post",
  "remix_trip",
  "publish_post",
  "share_trip",
  "comment_post",
  "follow_user"
]);

type TrackEventInput = {
  name: string;
  userId?: string | null;
  anonSessionId?: string | null;
  sessionId?: string | null;
  props?: Record<string, unknown> | null;
};

function sanitizeEventName(name: string) {
  const normalized = name.trim().toLowerCase();
  if (ALLOWED_EVENTS.has(normalized)) return normalized;
  return normalized.slice(0, 60);
}

function sanitizeProps(props?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
  if (!props) return undefined;
  try {
    // Force JSON-serializable payloads for stable event storage.
    return JSON.parse(JSON.stringify(props)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

export async function trackEvent(input: TrackEventInput) {
  const eventName = sanitizeEventName(input.name);
  if (!eventName) return null;

  return db.event.create({
    data: {
      name: eventName,
      userId: input.userId ?? null,
      anonSessionId: input.anonSessionId ?? null,
      sessionId: input.sessionId ?? null,
      props: sanitizeProps(input.props)
    }
  });
}

export async function trackEventWithActor(input: {
  name: string;
  userId?: string | null;
  sessionId?: string | null;
  props?: Record<string, unknown> | null;
}) {
  if (input.userId) {
    return trackEvent({
      name: input.name,
      userId: input.userId,
      sessionId: input.sessionId,
      props: input.props
    });
  }

  const anonSession = await getOrCreateAnonymousSession();
  return trackEvent({
    name: input.name,
    anonSessionId: anonSession.id,
    sessionId: input.sessionId || anonSession.token,
    props: input.props
  });
}

export async function trackFeedImpressions(input: {
  postIds: string[];
  source: FeedSource;
  userId?: string | null;
  sessionId: string;
}) {
  if (!input.postIds.length) return { count: 0 };

  const created = await db.feedImpression.createMany({
    data: input.postIds.map((postId, index) => ({
      userId: input.userId ?? null,
      postId,
      source: input.source,
      position: index,
      sessionId: input.sessionId
    }))
  });

  return { count: created.count };
}

export async function trackFeedAction(input: {
  postId: string;
  actionType: string;
  source?: FeedSource;
  userId?: string | null;
}) {
  return db.feedAction.create({
    data: {
      postId: input.postId,
      actionType: input.actionType.slice(0, 60),
      source: input.source,
      userId: input.userId ?? null
    }
  });
}

export async function createNotification(input: {
  userId: string;
  type: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type.slice(0, 60),
      entityId: input.entityId,
      payload: sanitizeProps(input.payload)
    }
  });
}
