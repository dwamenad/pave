import { describe, expect, it } from "vitest";
import { computeFeedScore } from "@/lib/server/feed-ranker";

describe("feed ranking", () => {
  it("scores higher engagement above low engagement at similar age", () => {
    const now = new Date();
    const high = computeFeedScore({
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      likes: 30,
      comments: 12,
      saves: 8
    });
    const low = computeFeedScore({
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      likes: 2,
      comments: 0,
      saves: 1
    });

    expect(high).toBeGreaterThan(low);
  });

  it("applies recency decay", () => {
    const fresh = computeFeedScore({
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      likes: 10,
      comments: 2,
      saves: 2
    });
    const old = computeFeedScore({
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      likes: 10,
      comments: 2,
      saves: 2
    });

    expect(fresh).toBeGreaterThan(old);
  });
});
