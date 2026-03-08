import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { createNotification, trackEventWithActor } from "@/lib/server/events";
import { requireApiUser } from "@/lib/server/route-user";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const auth = await requireApiUser(request);
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
        create: sourceTrip.days.map((day: (typeof sourceTrip.days)[number]) => ({
          dayIndex: day.dayIndex,
          items: {
            create: day.items.map((item: (typeof day.items)[number]) => ({
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

  const work: Promise<unknown>[] = [
    trackEventWithActor({
      name: "remix_trip",
      userId: auth.user.id,
      props: {
        sourceTripId: sourceTrip.id,
        remixedTripId: remixedTrip.id
      }
    })
  ];

  if (sourceTrip.authorId && sourceTrip.authorId !== auth.user.id) {
    work.push(
      createNotification({
        userId: sourceTrip.authorId,
        type: "TRIP_REMIXED",
        entityId: remixedTrip.id,
        payload: {
          sourceTripId: sourceTrip.id,
          remixedById: auth.user.id
        }
      })
    );
  }

  await Promise.all(work);

  return NextResponse.json({
    trip: remixedTrip,
    url: `/trip/${remixedTrip.slug}`
  });
}
