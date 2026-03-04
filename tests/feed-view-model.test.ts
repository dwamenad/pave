import { describe, expect, it } from "vitest";
import { buildTrendingDestinations, derivePlannerRole, formatFeedExcerpt } from "@/lib/feed-view-model";
import type { PostSummary } from "@/lib/types";

function makePost(input: {
  id: string;
  destination?: string;
  tripTitle: string;
  mediaUrl?: string | null;
  daysCount?: number;
  caption?: string;
}): PostSummary {
  return {
    id: input.id,
    caption: input.caption || "A sample itinerary post",
    mediaUrl: input.mediaUrl ?? null,
    destinationLabel: input.destination ?? null,
    visibility: "PUBLIC",
    status: "ACTIVE",
    tags: [],
    createdAt: new Date().toISOString(),
    author: {
      id: "u1",
      username: "traveler",
      name: "Traveler",
      image: null,
      bio: null
    },
    trip: {
      id: "t1",
      slug: "trip-1",
      title: input.tripTitle,
      daysCount: input.daysCount ?? 3
    },
    counts: {
      likes: 10,
      saves: 5,
      comments: 2
    }
  };
}

describe("feed view model helpers", () => {
  it("formats and truncates excerpts deterministically", () => {
    const long = "Tokyo nights and ramen adventures across Shibuya with detailed station-by-station tips.";
    expect(formatFeedExcerpt(long, 40)).toBe('"Tokyo nights and ramen adventures acros…"');
    expect(formatFeedExcerpt("short caption", 40)).toBe('"short caption"');
  });

  it("builds stable top trending destinations with thumbnail fallback", () => {
    const posts = [
      makePost({ id: "1", destination: "Tokyo", tripTitle: "Tokyo 3 Day", mediaUrl: "https://img/tokyo.jpg" }),
      makePost({ id: "2", destination: "Paris", tripTitle: "Paris 5 Day", mediaUrl: "https://img/paris.jpg" }),
      makePost({ id: "3", destination: "Tokyo", tripTitle: "Tokyo Hidden Gems", mediaUrl: null }),
      makePost({ id: "4", destination: "Bali", tripTitle: "Bali Escape", mediaUrl: "https://img/bali.jpg" }),
      makePost({ id: "5", destination: "Paris", tripTitle: "Paris Food Tour", mediaUrl: null }),
      makePost({ id: "6", destination: "Tokyo", tripTitle: "Tokyo Again", mediaUrl: null })
    ];

    const trending = buildTrendingDestinations(posts, 3);

    expect(trending.map((item) => item.destination)).toEqual(["Tokyo", "Paris", "Bali"]);
    expect(trending[0]?.count).toBe(3);
    expect(trending[0]?.thumbnailUrl).toBe("https://img/tokyo.jpg");
  });

  it("derives planner role from bio first, then deterministic fallback", () => {
    expect(derivePlannerRole({ bio: "Luxury planner and hotel specialist", score: 100, name: "Sarah" })).toBe("Luxury Expert");
    expect(derivePlannerRole({ bio: null, score: 100, name: "Alex" })).toBeDefined();
  });
});
