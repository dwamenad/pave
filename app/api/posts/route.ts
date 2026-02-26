import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";
import { containsProfanity, sanitizeToTags } from "@/lib/server/moderation";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

  const body = await request.json();
  const tripId = String(body.tripId || "");
  const caption = String(body.caption || "").slice(0, 2000);
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl) : null;
  const visibility = body.visibility === "UNLISTED" ? "UNLISTED" : "PUBLIC";
  const destinationLabel = body.destinationLabel ? String(body.destinationLabel).slice(0, 120) : null;
  const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
  const tags = sanitizeToTags(Array.isArray(body.tags) ? body.tags.map((tag: unknown) => String(tag)) : []);

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
      mediaUrl,
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

  return NextResponse.json({ post });
}
