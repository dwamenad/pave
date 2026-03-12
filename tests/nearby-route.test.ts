import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/place-service", () => ({
  searchNearbyPlaces: vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      data: [{ placeId: "eat-1", name: "Eat", lat: 1, lng: 2, types: [] }],
      degraded: false,
      stale: false,
      cacheState: "hit",
      fetchedAt: "2026-03-11T10:00:00.000Z",
      reasonCode: undefined,
      mockMode: false
    })
    .mockResolvedValueOnce({
      ok: true,
      data: [{ placeId: "coffee-1", name: "Coffee", lat: 1, lng: 2, types: [] }],
      degraded: true,
      stale: true,
      cacheState: "stale",
      fetchedAt: "2026-03-10T10:00:00.000Z",
      reasonCode: "provider_unavailable",
      mockMode: false
    })
    .mockResolvedValueOnce({
      ok: true,
      data: [],
      degraded: false,
      stale: false,
      cacheState: "miss",
      fetchedAt: null,
      reasonCode: "no_results",
      mockMode: false
    })
}));

import { GET } from "@/app/api/nearby/route";

describe("nearby route", () => {
  it("returns degraded and stale metadata when cached results are used", async () => {
    const request = new NextRequest("http://localhost/api/nearby?lat=38.72&lng=-9.13");

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.degraded).toBe(true);
    expect(json.stale).toBe(true);
    expect(json.reasonCode).toBe("provider_unavailable");
    expect(json.eat).toHaveLength(1);
    expect(json.coffee).toHaveLength(1);
  });
});
