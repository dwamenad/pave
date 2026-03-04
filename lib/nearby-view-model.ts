import type { PlaceCard } from "@/lib/types";

export type NearbyCategory = "eat" | "coffee" | "do";

export type NearbyPayload = {
  eat: PlaceCard[];
  coffee: PlaceCard[];
  do: PlaceCard[];
};

export function normalizeNearbyCategory(input?: string): NearbyCategory {
  if (input === "eat" || input === "coffee" || input === "do") return input;
  return "do";
}

export function getNearbyPlacesByCategory(data: NearbyPayload | null, category: NearbyCategory): PlaceCard[] {
  if (!data) return [];
  return data[category] || [];
}
