import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackEventWithActor } from "@/lib/server/events";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireApiUser } from "@/lib/server/route-user";
import { containsProfanity, sanitizeToTags } from "@/lib/server/moderation";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";

function normalizeExternalMediaUrl(value: unknown) {
  if (!value) return null;
  const mediaUrl = String(value).trim();
  if (!mediaUrl) return null;

  try {
    const parsed = new URL(mediaUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false as const };
    }
    return { ok: true as const, value: parsed.toString() };
  } catch {
    return { ok: false as const };
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;
  const limited = await enforceRateLimit(request, { policy: "user_content", identifier: auth.user.id });
  if (limited) return limited;

  const body = await request.json();
  const tripId = String(body.tripId || "");
  const caption = String(body.caption || "").slice(0, 2000);
  const mediaUrl = normalizeExternalMediaUrl(body.mediaUrl);
  const visibility = body.visibility === "UNLISTED" ? "UNLISTED" : "PUBLIC";
  const destinationLabel = body.destinationLabel ? String(body.destinationLabel).slice(0, 120) : null;
  const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
  const tags = sanitizeToTags(Array.isArray(body.tags) ? body.tags.map((tag: unknown) => String(tag)) : []);

  if (mediaUrl && !mediaUrl.ok) {
    return NextResponse.json(
      {
        error: "Posts currently support external http(s) media URLs only. Direct file uploads are not available yet.",
        code: "invalid_media_url"
      },
      { status: 400 }
    );
  }

  const trip = await db.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const metadata = await fetchMetadataForLinks(links);
  const status = containsProfanity(caption) ? "HIDDEN" : "ACTIVE";

  const post = await db.post.create({
    data: {
      authorId: auth.user.id,
      tripId,
      caption,
      mediaUrl: mediaUrl?.ok ? mediaUrl.value : null,
      visibility,
      destinationLabel,
      status,
      tags,
      sourceLinks: {
        create: metadata.map((item) => ({
          url: item.url,
          domain: item.domain,
          title: item.title,
          description: item.description,
          thumbnailUrl: item.thumbnailUrl,
          parsedHints: item.parsedHints
        }))
      }
    },
    include: {
      sourceLinks: true
    }
  });

  const followers = await db.follow.findMany({
    where: {
      followeeId: auth.user.id
    },
    select: {
      followerId: true
    }
  });

  if (followers.length) {
    await db.notification.createMany({
      data: followers.map((row: { followerId: string }) => ({
        userId: row.followerId,
        type: "NEW_POST",
        entityId: post.id,
        payload: {
          authorId: auth.user.id,
          authorUsername: auth.user.username,
          tripId,
          destinationLabel: destinationLabel || trip.title
        }
      }))
    });
  }

  await trackEventWithActor({
    name: "publish_post",
    userId: auth.user.id,
    props: {
      postId: post.id,
      tripId,
      visibility,
      status,
      mediaMode: mediaUrl?.ok ? "external_url" : "none"
    }
  });

  return NextResponse.json({ post });
}
