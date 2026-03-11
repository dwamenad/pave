import type { AiCreatePreferences, AiTripDraft, AiTripDraftDay, AiTripDraftItem } from "@pave/contracts";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { placesProvider } from "@/lib/providers";
import { budgetToPriceRange, CATEGORY_TYPES, pickTopPlaces } from "@/lib/itinerary";
import type { BudgetMode, HubCategory, PlaceDetails, PreferenceInput } from "@/lib/types";
import { slugify } from "@/lib/utils";

function paceToRadiusMeters(pace: AiCreatePreferences["pace"] | PreferenceInput["pace"]) {
  return pace === "slow" ? 2800 : pace === "packed" ? 5000 : 4000;
}

async function loadNearbyCategoryMap(input: {
  centerLat: number;
  centerLng: number;
  budget: BudgetMode;
  pace: AiCreatePreferences["pace"] | PreferenceInput["pace"];
}) {
  const price = budgetToPriceRange(input.budget);
  const radiusMeters = paceToRadiusMeters(input.pace);
  const nearbyByCategory = new Map<HubCategory, PlaceDetails[]>();

  for (const category of ["eat", "stay", "do"] as HubCategory[]) {
    const types = CATEGORY_TYPES[category];
    let merged: PlaceDetails[] = [];

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

    nearbyByCategory.set(category, Array.from(new Map(merged.map((place) => [place.placeId, place])).values()));
  }

  return nearbyByCategory;
}

function buildDraftSummary(preferences: AiCreatePreferences) {
  const vibeCopy = preferences.vibeTags.length ? preferences.vibeTags.slice(0, 3).join(", ") : "local highlights";
  return `${preferences.days}-day ${preferences.pace} plan tuned for ${preferences.budget} travel with ${vibeCopy}.`;
}

function buildDraftDayTitle(dayIndex: number, preferences: AiCreatePreferences) {
  if (dayIndex === 1) return preferences.days === 1 ? "Arrival and anchor stops" : "Arrival and neighborhood highlights";
  if (dayIndex === preferences.days) return "Capstone day and final favorites";
  return `Day ${dayIndex} local circuit`;
}

function buildDraftDaySummary(dayIndex: number, preferences: AiCreatePreferences) {
  if (dayIndex === 1) return `Ease into the trip with walkable stops that match a ${preferences.pace} travel pace.`;
  if (dayIndex === preferences.days) return "Close with the strongest-rated stops still clustered near the trip center.";
  return "Keep the route compact and balanced across food, activities, and downtime.";
}

function toDraftItem(place: PlaceDetails, category: HubCategory): AiTripDraftItem {
  return {
    placeId: place.placeId,
    category,
    name: place.name,
    rationale:
      category === "stay"
        ? "High-confidence stay option close to the rest of the plan."
        : "High-rated stop that keeps the route tight and easy to follow.",
    notes: place.address ?? null
  };
}

export function getDraftPlaceIds(draft: AiTripDraft) {
  return draft.days.flatMap((day) => day.items.map((item) => item.placeId));
}

export function findDuplicateDraftPlaceIds(draft: AiTripDraft) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const placeId of getDraftPlaceIds(draft)) {
    if (seen.has(placeId)) duplicates.add(placeId);
    seen.add(placeId);
  }

  return Array.from(duplicates);
}

export async function buildFallbackTripDraft(input: {
  placeId: string;
  title: string;
  centerLat: number;
  centerLng: number;
  preferences: AiCreatePreferences;
  destinationName?: string;
  destinationAddress?: string | null;
  destinationPhotoUrl?: string | null;
}) {
  const used = new Set<string>();
  const nearbyByCategory = await loadNearbyCategoryMap({
    centerLat: input.centerLat,
    centerLng: input.centerLng,
    budget: input.preferences.budget,
    pace: input.preferences.pace
  });

  const days: AiTripDraftDay[] = [];

  for (let dayIndex = 1; dayIndex <= input.preferences.days; dayIndex += 1) {
    const doCount = input.preferences.pace === "packed" ? 2 : 1;
    const eatCount = input.preferences.pace === "slow" ? 1 : 2;

    const doPick = pickTopPlaces(nearbyByCategory.get("do") || [], input.centerLat, input.centerLng, doCount, used);
    doPick.forEach((place) => used.add(place.placeId));

    const eatPick = pickTopPlaces(nearbyByCategory.get("eat") || [], input.centerLat, input.centerLng, eatCount, used);
    eatPick.forEach((place) => used.add(place.placeId));

    const dayItems = [...doPick.map((place) => toDraftItem(place, "do")), ...eatPick.map((place) => toDraftItem(place, "eat"))];

    days.push({
      dayIndex,
      title: buildDraftDayTitle(dayIndex, input.preferences),
      summary: buildDraftDaySummary(dayIndex, input.preferences),
      items: dayItems
    });
  }

  const stayOption = pickTopPlaces(nearbyByCategory.get("stay") || [], input.centerLat, input.centerLng, 1, used)[0];
  if (stayOption && days[0]) {
    days[0].items.push(toDraftItem(stayOption, "stay"));
  }

  return {
    title: input.title,
    summary: buildDraftSummary(input.preferences),
    destination: {
      placeId: input.placeId,
      name: input.destinationName || input.title,
      lat: input.centerLat,
      lng: input.centerLng,
      address: input.destinationAddress ?? null,
      photoUrl: input.destinationPhotoUrl ?? null
    },
    days
  } satisfies AiTripDraft;
}

export async function createTripFromDraft(input: {
  draft: AiTripDraft;
  authorId?: string;
}) {
  const destination = await placesProvider.placeDetails(input.draft.destination.placeId);
  const uniquePlaceIds = Array.from(new Set(getDraftPlaceIds(input.draft)));
  const canonicalPlaces = await Promise.all(uniquePlaceIds.map((placeId) => placesProvider.placeDetails(placeId)));
  const placeMap = new Map(canonicalPlaces.map((place) => [place.placeId, place]));

  const slug = `${slugify(input.draft.title)}-${nanoid(6).toLowerCase()}`;
  const trip = await db.trip.create({
    data: {
      slug,
      title: input.draft.title,
      centerLat: destination.lat,
      centerLng: destination.lng,
      placeId: destination.placeId,
      authorId: input.authorId,
      days: {
        create: input.draft.days.map((day) => ({
          dayIndex: day.dayIndex
        }))
      }
    },
    include: { days: true }
  });

  for (const day of input.draft.days) {
    const tripDay = trip.days.find((item) => item.dayIndex === day.dayIndex);
    if (!tripDay) continue;

    await db.tripItem.createMany({
      data: day.items.map((item, index) => {
        const canonical = placeMap.get(item.placeId);
        if (!canonical) {
          throw new Error(`Missing canonical place for ${item.placeId}`);
        }

        return {
          tripDayId: tripDay.id,
          placeId: canonical.placeId,
          name: canonical.name,
          lat: canonical.lat,
          lng: canonical.lng,
          category: item.category,
          orderIndex: index,
          notes: [item.notes, item.rationale].filter(Boolean).join("\n\n") || null
        };
      })
    });
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
  const budget = input.preferences?.budget || input.budget;
  const pace = input.preferences?.pace || "balanced";
  const draft = await buildFallbackTripDraft({
    placeId: input.placeId || `center-${slugify(input.title)}`,
    title: input.title,
    centerLat: input.centerLat,
    centerLng: input.centerLng,
    preferences: {
      budget,
      days: input.days as AiCreatePreferences["days"],
      pace,
      vibeTags: input.preferences?.vibeTags || [],
      dietary: input.preferences?.dietary || []
    }
  });

  return createTripFromDraft({
    draft: {
      ...draft,
      destination: {
        ...draft.destination,
        placeId: input.placeId || draft.destination.placeId
      }
    },
    authorId: input.authorId
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
