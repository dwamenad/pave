import type { PostSummary } from "@/lib/types";

export type TrendingDestination = {
  destination: string;
  count: number;
  thumbnailUrl?: string;
};

function isHttpUrl(value: string | null | undefined) {
  return !!value && /^https?:\/\//.test(value);
}

export function formatFeedExcerpt(caption: string, maxChars = 96) {
  const cleaned = caption.trim().replace(/\s+/g, " ");
  if (!cleaned) return "\"\"";
  if (cleaned.length <= maxChars) return `\"${cleaned}\"`;
  return `\"${cleaned.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…\"`;
}

export function buildTrendingDestinations(posts: PostSummary[], limit = 3): TrendingDestination[] {
  const byDestination = new Map<string, TrendingDestination>();

  for (const post of posts) {
    const destination = post.destinationLabel || post.trip.title;
    const existing = byDestination.get(destination);

    if (!existing) {
      byDestination.set(destination, {
        destination,
        count: 1,
        thumbnailUrl: isHttpUrl(post.mediaUrl) ? post.mediaUrl! : undefined
      });
      continue;
    }

    existing.count += 1;
    if (!existing.thumbnailUrl && isHttpUrl(post.mediaUrl)) {
      existing.thumbnailUrl = post.mediaUrl!;
    }
  }

  return [...byDestination.values()]
    .sort((a, b) => (b.count - a.count) || a.destination.localeCompare(b.destination))
    .slice(0, limit);
}

function deterministicIndex(input: string, length: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return length ? hash % length : 0;
}

export function derivePlannerRole(input: {
  bio?: string | null;
  score: number;
  name?: string | null;
}) {
  const bio = (input.bio || "").toLowerCase();

  if (bio.includes("luxury")) return "Luxury Expert";
  if (bio.includes("budget")) return "Budget Soloist";
  if (bio.includes("landscape") || bio.includes("photo")) return "Landscape Pro";
  if (bio.includes("adventure") || bio.includes("hike")) return "Adventure Guide";
  if (bio.includes("food")) return "Food Scout";

  if (input.score >= 2500) return "Elite Planner";
  if (input.score >= 1500) return "Top Curator";

  const fallbackRoles = [
    "Trip Curator",
    "Route Designer",
    "Culture Scout",
    "Weekend Planner"
  ];

  const key = `${input.name || "planner"}:${input.score}`;
  return fallbackRoles[deterministicIndex(key, fallbackRoles.length)];
}
