import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { placesProvider } from "@/lib/providers";
import { budgetToPriceRange, CATEGORY_TYPES, pickTopPlaces } from "@/lib/itinerary";
import type { BudgetMode, HubCategory, PreferenceInput } from "@/lib/types";
import { slugify } from "@/lib/utils";

export async function generateTripPlan(input: {
  placeId?: string;
  title: string;
  centerLat: number;
  centerLng: number;
  days: number;
  budget: BudgetMode;
  preferences?: PreferenceInput;
  authorId?: string;
}) {
  const used = new Set<string>();
  const budget = input.preferences?.budget || input.budget;
  const pace = input.preferences?.pace || "balanced";
  const price = budgetToPriceRange(budget);
  const nearbyByCategory = new Map<HubCategory, Awaited<ReturnType<typeof placesProvider.nearbySearch>>>();
  const radiusMeters = pace === "slow" ? 2800 : pace === "packed" ? 5000 : 4000;

  for (const category of ["eat", "stay", "do"] as HubCategory[]) {
    const types = CATEGORY_TYPES[category];
    let merged: Awaited<ReturnType<typeof placesProvider.nearbySearch>> = [];

    for (const type of types.slice(0, 3)) {
      const results = await placesProvider.nearbySearch({
        lat: input.centerLat,
        lng: input.centerLng,
        type,
        radiusMeters,
        ...price
      });
      merged = merged.concat(results);
    }

    const deduped = Array.from(new Map(merged.map((m) => [m.placeId, m])).values());
    nearbyByCategory.set(category, deduped);
  }

  const slug = `${slugify(input.title)}-${nanoid(6).toLowerCase()}`;

  const trip = await db.trip.create({
    data: {
      slug,
      title: input.title,
      centerLat: input.centerLat,
      centerLng: input.centerLng,
      placeId: input.placeId,
      authorId: input.authorId,
      days: {
        create: Array.from({ length: input.days }, (_, idx) => ({
          dayIndex: idx + 1
        }))
      }
    },
    include: { days: true }
  });

  for (const day of trip.days) {
    const doCount = pace === "packed" ? 2 : 1;
    const doPick = pickTopPlaces(nearbyByCategory.get("do") || [], input.centerLat, input.centerLng, doCount, used);
    doPick.forEach((p) => used.add(p.placeId));

    const eatCount = pace === "slow" ? 1 : 2;
    const eatPick = pickTopPlaces(nearbyByCategory.get("eat") || [], input.centerLat, input.centerLng, eatCount, used);
    eatPick.forEach((p) => used.add(p.placeId));

    const items = [...doPick, ...eatPick];

    await db.tripItem.createMany({
      data: items.map((item, index) => ({
        tripDayId: day.id,
        placeId: item.placeId,
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        category: index === 0 ? "do" : "eat",
        orderIndex: index,
        notes: item.rationale
      }))
    });
  }

  const stayOption = pickTopPlaces(nearbyByCategory.get("stay") || [], input.centerLat, input.centerLng, 1, used)[0];

  if (stayOption) {
    const firstDay = trip.days.find((d) => d.dayIndex === 1);
    if (firstDay) {
      await db.tripItem.create({
        data: {
          tripDayId: firstDay.id,
          placeId: stayOption.placeId,
          name: stayOption.name,
          lat: stayOption.lat,
          lng: stayOption.lng,
          category: "stay",
          orderIndex: 99,
          notes: "Balanced lodging option with strong reviews near your itinerary."
        }
      });
    }
  }

  return db.trip.findUnique({
    where: { id: trip.id },
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
}

export async function getTripBySlug(slug: string) {
  return db.trip.findUnique({
    where: { slug },
    include: {
      remixedInto: {
        include: {
          sourceTrip: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
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
}

export async function getTripById(id: string) {
  return db.trip.findUnique({
    where: { id },
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
}

export async function getVoteTotals(tripId: string) {
  const votes = await db.vote.groupBy({
    by: ["placeId", "voteValue"],
    where: { tripId },
    _count: { _all: true }
  });

  const totals: Record<string, { up: number; down: number }> = {};
  for (const row of votes) {
    if (!totals[row.placeId]) totals[row.placeId] = { up: 0, down: 0 };
    if (row.voteValue > 0) totals[row.placeId].up = row._count._all;
    if (row.voteValue < 0) totals[row.placeId].down = row._count._all;
  }

  return totals;
}
