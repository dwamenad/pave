import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/server/route-user";
import { slugify } from "@/lib/utils";

export async function POST(_: NextRequest, { params }: { params: { tripId: string } }) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

  const sourceTrip = await db.trip.findUnique({
    where: { id: params.tripId },
    include: {
      days: {
        include: {
          items: {
            orderBy: { orderIndex: "asc" }
          }
        },
        orderBy: { dayIndex: "asc" }
      }
    }
  });

  if (!sourceTrip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const remixedTrip = await db.trip.create({
    data: {
      slug: `${slugify(`${sourceTrip.title} remix`)}-${nanoid(6).toLowerCase()}`,
      title: `${sourceTrip.title} (Remix)`,
      centerLat: sourceTrip.centerLat,
      centerLng: sourceTrip.centerLng,
      placeId: sourceTrip.placeId,
      authorId: auth.user.id,
      days: {
        create: sourceTrip.days.map((day) => ({
          dayIndex: day.dayIndex,
          items: {
            create: day.items.map((item) => ({
              placeId: item.placeId,
              name: item.name,
              lat: item.lat,
              lng: item.lng,
              category: item.category,
              orderIndex: item.orderIndex,
              notes: item.notes
            }))
          }
        }))
      }
    }
  });

  await db.tripRemix.create({
    data: {
      sourceTripId: sourceTrip.id,
      remixedTripId: remixedTrip.id,
      remixedById: auth.user.id
    }
  });

  return NextResponse.json({
    trip: remixedTrip,
    url: `/trip/${remixedTrip.slug}`
  });
}
