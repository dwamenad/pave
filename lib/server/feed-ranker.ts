import type { FeedRankFeatures, FeedRankResult, FeedSource } from "@/lib/types";

export function computeFeedScore(input: {
  createdAt: Date;
  likes: number;
  comments: number;
  saves: number;
}) {
  const ageHours = Math.max(1, (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60));
  const engagement = input.likes * 3 + input.comments * 2 + input.saves * 2;
  return engagement - ageHours * 0.25;
}

export type FeedRankCandidate = {
  postId: string;
  source: FeedSource;
  createdAt: Date;
  likes: number;
  saves: number;
  comments: number;
  remixCount: number;
  destination: string;
  followsAuthor: boolean;
  blocked: boolean;
  velocity?: number;
  negativeSignal?: number;
};

export function buildRankFeatures(candidate: FeedRankCandidate): FeedRankFeatures {
  const ageHours = Math.max(1, (Date.now() - candidate.createdAt.getTime()) / (1000 * 60 * 60));
  return {
    ageHours,
    likes: candidate.likes,
    saves: candidate.saves,
    comments: candidate.comments,
    remixCount: candidate.remixCount,
    creatorAffinity: candidate.followsAuthor ? 1 : 0,
    velocity: candidate.velocity ?? (candidate.likes + candidate.comments + candidate.saves) / ageHours,
    negativeSignal: candidate.negativeSignal ?? 0,
    blocked: candidate.blocked
  };
}

export function computeFeedRank(candidate: FeedRankCandidate): FeedRankResult {
  const features = buildRankFeatures(candidate);

  if (features.blocked) {
    return {
      postId: candidate.postId,
      source: candidate.source,
      score: -100000,
      features
    };
  }

  const engagement =
    features.likes * 1.4 +
    features.saves * 2.2 +
    features.comments * 1.8 +
    features.remixCount * 2.6;

  const sourceBoost =
    candidate.source === "FOLLOWING" ? 2.2 : candidate.source === "TRENDING" ? 1.2 : 1;

  const score =
    engagement +
    features.creatorAffinity * 1.5 +
    features.velocity * 0.9 +
    sourceBoost -
    features.ageHours * 0.25 -
    features.negativeSignal * 3;

  return {
    postId: candidate.postId,
    source: candidate.source,
    score,
    features
  };
}

export function rerankForDiversity<T extends { score: number; destination: string }>(
  ranked: T[],
  limit = 10
) {
  const pool = [...ranked].sort((a, b) => b.score - a.score);
  const picks: T[] = [];
  const destinationSeen = new Map<string, number>();

  while (pool.length && picks.length < limit) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;

    for (let i = 0; i < pool.length; i += 1) {
      const candidate = pool[i];
      const seenCount = destinationSeen.get(candidate.destination) || 0;
      const adjusted = candidate.score - seenCount * 1.5;

      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = i;
      }
    }

    const [next] = pool.splice(bestIndex, 1);
    picks.push(next);
    destinationSeen.set(next.destination, (destinationSeen.get(next.destination) || 0) + 1);
  }

  return picks;
}
