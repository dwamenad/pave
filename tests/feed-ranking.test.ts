import { describe, expect, it } from "vitest";
import { computeFeedRank, computeFeedScore, rerankForDiversity } from "@/lib/server/feed-ranker";

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

  it("downranks blocked candidates heavily", () => {
    const blocked = computeFeedRank({
      postId: "blocked",
      source: "FOR_YOU",
      createdAt: new Date(),
      likes: 99,
      saves: 80,
      comments: 50,
      remixCount: 20,
      destination: "Paris",
      followsAuthor: true,
      blocked: true
    });

    const visible = computeFeedRank({
      postId: "visible",
      source: "FOR_YOU",
      createdAt: new Date(),
      likes: 10,
      saves: 10,
      comments: 3,
      remixCount: 1,
      destination: "Rome",
      followsAuthor: false,
      blocked: false
    });

    expect(blocked.score).toBeLessThan(visible.score);
  });

  it("reranks for destination diversity", () => {
    const ranked = rerankForDiversity([
      {
        postId: "1",
        source: "FOR_YOU",
        score: 10,
        destination: "Paris",
        features: {
          ageHours: 1,
          likes: 10,
          saves: 1,
          comments: 1,
          remixCount: 0,
          creatorAffinity: 1,
          velocity: 1,
          negativeSignal: 0,
          blocked: false
        }
      },
      {
        postId: "2",
        source: "FOR_YOU",
        score: 9.9,
        destination: "Paris",
        features: {
          ageHours: 1,
          likes: 9,
          saves: 1,
          comments: 1,
          remixCount: 0,
          creatorAffinity: 0,
          velocity: 1,
          negativeSignal: 0,
          blocked: false
        }
      },
      {
        postId: "3",
        source: "FOR_YOU",
        score: 9.8,
        destination: "Accra",
        features: {
          ageHours: 1,
          likes: 9,
          saves: 1,
          comments: 1,
          remixCount: 0,
          creatorAffinity: 0,
          velocity: 1,
          negativeSignal: 0,
          blocked: false
        }
      }
    ]);

    expect(ranked[0]?.postId).toBe("1");
    expect(ranked[1]?.postId).toBe("3");
  });
});
