import { describe, expect, it } from "vitest";
import { getNearbyPlacesByCategory, normalizeNearbyCategory, type NearbyPayload } from "@/lib/nearby-view-model";

const sample: NearbyPayload = {
  eat: [{ placeId: "eat-1", name: "E", lat: 0, lng: 0, types: [] }],
  coffee: [{ placeId: "coffee-1", name: "C", lat: 0, lng: 0, types: [] }],
  do: [{ placeId: "do-1", name: "D", lat: 0, lng: 0, types: [] }]
};

describe("nearby view model", () => {
  it("normalizes category values", () => {
    expect(normalizeNearbyCategory("eat")).toBe("eat");
    expect(normalizeNearbyCategory("coffee")).toBe("coffee");
    expect(normalizeNearbyCategory("do")).toBe("do");
    expect(normalizeNearbyCategory("other")).toBe("do");
    expect(normalizeNearbyCategory()).toBe("do");
  });

  it("returns places for active category", () => {
    expect(getNearbyPlacesByCategory(sample, "eat").map((p) => p.placeId)).toEqual(["eat-1"]);
    expect(getNearbyPlacesByCategory(sample, "coffee").map((p) => p.placeId)).toEqual(["coffee-1"]);
    expect(getNearbyPlacesByCategory(sample, "do").map((p) => p.placeId)).toEqual(["do-1"]);
    expect(getNearbyPlacesByCategory(null, "do")).toEqual([]);
  });
});
