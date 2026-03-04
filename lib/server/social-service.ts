import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { computeFeedRank, rerankForDiversity, type FeedRankCandidate } from "@/lib/server/feed-ranker";
import type { CommentDTO, FeedSource, NotificationDTO, PostDetail, PostSummary } from "@/lib/types";

const PAGE_SIZE = 10;
const CANDIDATE_PAGE_SIZE = 40;

function toIso(date: Date) {
  return date.toISOString();
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

async function getBlockedUserIdSet(userId?: string) {
  if (!userId) return new Set<string>();

  const [blockedByMe, blockedMe] = await Promise.all([
    db.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    }),
    db.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true }
    })
  ]);

  const ids = new Set<string>();
  for (const row of blockedByMe) ids.add(row.blockedId);
  for (const row of blockedMe) ids.add(row.blockerId);
  return ids;
}

async function getFollowingIds(userId?: string) {
  if (!userId) return new Set<string>();
  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followeeId: true }
  });
  return new Set(following.map((row) => row.followeeId));
}

const postQueryArgs = Prisma.validator<Prisma.PostFindManyArgs>()({
  select: {
    id: true,
    authorId: true,
    caption: true,
    mediaUrl: true,
    destinationLabel: true,
    visibility: true,
    status: true,
    tags: true,
    createdAt: true,
    author: {
      select: {
        id: true,
        username: true,
        name: true,
        image: true
      }
    },
    trip: {
      select: {
        id: true,
        slug: true,
        title: true,
        _count: {
          select: {
            remixedFrom: true
          }
        }
      }
    },
    _count: {
      select: {
        likes: true,
        saves: true,
        comments: {
          where: {
            status: "ACTIVE" as const
          }
        },
        reports: {
          where: {
            status: "OPEN" as const
          }
        }
      }
    }
  },
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  take: CANDIDATE_PAGE_SIZE + 1
});

type FeedPost = Prisma.PostGetPayload<typeof postQueryArgs>;

type RankedCandidate = {
  destination: string;
  post: FeedPost;
  source: FeedSource;
  score: number;
};

function mapToSummary(input: RankedCandidate): PostSummary {
  const { post } = input;
  return {
    id: post.id,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    destinationLabel: post.destinationLabel,
    visibility: post.visibility,
    status: post.status,
    tags: post.tags,
    createdAt: toIso(post.createdAt),
    author: {
      id: post.author.id,
      username: post.author.username,
      name: post.author.name,
      image: post.author.image
    },
    trip: {
      id: post.trip.id,
      slug: post.trip.slug,
      title: post.trip.title
    },
    counts: {
      likes: post._count.likes,
      saves: post._count.saves,
      comments: post._count.comments
    },
    source: input.source,
    score: Number(input.score.toFixed(3))
  };
}

function rankPosts(input: {
  posts: FeedPost[];
  source: FeedSource;
  followingIds: Set<string>;
  blockedIds: Set<string>;
  limit?: number;
}) {
  const ranked = input.posts.map((post) => {
    const destination = post.destinationLabel || post.trip.title;
    const candidate: FeedRankCandidate = {
      postId: post.id,
      source: input.source,
      createdAt: post.createdAt,
      likes: post._count.likes,
      saves: post._count.saves,
      comments: post._count.comments,
      remixCount: post.trip._count.remixedFrom,
      destination,
      followsAuthor: input.followingIds.has(post.authorId),
      blocked: input.blockedIds.has(post.authorId),
      negativeSignal: post._count.reports > 0 ? 1 + post._count.reports * 0.2 : 0
    };

    const rank = computeFeedRank(candidate);
    return {
      destination,
      post,
      source: rank.source,
      score: rank.score
    } satisfies RankedCandidate;
  });

  const reranked = rerankForDiversity(ranked, input.limit ?? PAGE_SIZE + 1);
  return reranked;
}

async function fetchRecentPosts(input: {
  blockedIds: Set<string>;
  authorIds?: string[];
  cursor?: string;
  maxAgeHours?: number;
}) {
  const where: {
    status: "ACTIVE";
    visibility: "PUBLIC";
    authorId?: { in?: string[]; notIn?: string[] };
    createdAt?: { gte: Date };
  } = {
    status: "ACTIVE",
    visibility: "PUBLIC"
  };

  if (input.blockedIds.size) {
    where.authorId = {
      ...(where.authorId || {}),
      notIn: [...input.blockedIds]
    };
  }

  if (input.authorIds) {
    where.authorId = {
      ...(where.authorId || {}),
      in: input.authorIds
    };
  }

  if (input.maxAgeHours) {
    where.createdAt = {
      gte: new Date(Date.now() - input.maxAgeHours * 60 * 60 * 1000)
    };
  }

  return db.post.findMany({
    ...postQueryArgs,
    where,
    ...(input.cursor
      ? {
          skip: 1,
          cursor: {
            id: input.cursor
          }
        }
      : {})
  });
}

export async function getFeed(options?: {
  cursor?: string;
  source?: FeedSource;
  userId?: string;
}) {
  const source = options?.source || "FOR_YOU";

  if (source === "FOLLOWING") {
    return getFollowingFeed(options?.userId, options?.cursor);
  }

  if (source === "TRENDING") {
    return getTrendingFeed(options?.userId, options?.cursor);
  }

  return getForYouFeed(options?.userId, options?.cursor);
}

export async function getForYouFeed(userId?: string, cursor?: string) {
  const [blockedIds, followingIds] = await Promise.all([
    getBlockedUserIdSet(userId),
    getFollowingIds(userId)
  ]);

  const followedAuthorIds = [...followingIds];

  const [fromFollowing, fromGlobal] = await Promise.all([
    followedAuthorIds.length
      ? fetchRecentPosts({ blockedIds, authorIds: followedAuthorIds, cursor })
      : Promise.resolve([]),
    fetchRecentPosts({ blockedIds, cursor })
  ]);

  const merged = uniqueById([...fromFollowing, ...fromGlobal]);
  const ranked = rankPosts({
    posts: merged,
    source: "FOR_YOU",
    followingIds,
    blockedIds,
    limit: PAGE_SIZE + 1
  });

  const hasMore = ranked.length > PAGE_SIZE;
  const items = ranked.slice(0, PAGE_SIZE).map(mapToSummary);

  return {
    source: "FOR_YOU" as const,
    items,
    nextCursor: hasMore ? ranked[PAGE_SIZE - 1]?.post.id ?? null : null
  };
}

export async function getFollowingFeed(userId?: string, cursor?: string) {
  const [blockedIds, followingIds] = await Promise.all([
    getBlockedUserIdSet(userId),
    getFollowingIds(userId)
  ]);

  const followedAuthorIds = [...followingIds];
  if (!followedAuthorIds.length) {
    return {
      source: "FOLLOWING" as const,
      items: [],
      nextCursor: null
    };
  }

  const posts = await fetchRecentPosts({
    blockedIds,
    authorIds: followedAuthorIds,
    cursor
  });

  const ranked = rankPosts({
    posts,
    source: "FOLLOWING",
    followingIds,
    blockedIds,
    limit: PAGE_SIZE + 1
  });

  const hasMore = ranked.length > PAGE_SIZE;
  const items = ranked.slice(0, PAGE_SIZE).map((entry) => ({
    ...mapToSummary(entry),
    followedAuthor: true
  }));

  return {
    source: "FOLLOWING" as const,
    items,
    nextCursor: hasMore ? ranked[PAGE_SIZE - 1]?.post.id ?? null : null
  };
}

export async function getTrendingFeed(userId?: string, cursor?: string) {
  const [blockedIds, followingIds] = await Promise.all([
    getBlockedUserIdSet(userId),
    getFollowingIds(userId)
  ]);

  const posts = await fetchRecentPosts({
    blockedIds,
    cursor,
    maxAgeHours: 72
  });

  const ranked = rankPosts({
    posts,
    source: "TRENDING",
    followingIds,
    blockedIds,
    limit: PAGE_SIZE + 1
  });

  const hasMore = ranked.length > PAGE_SIZE;
  const items = ranked.slice(0, PAGE_SIZE).map(mapToSummary);

  return {
    source: "TRENDING" as const,
    items,
    nextCursor: hasMore ? ranked[PAGE_SIZE - 1]?.post.id ?? null : null
  };
}

function mapComment(comment: {
  id: string;
  body: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  createdAt: Date;
  author: { id: string; username: string | null; name: string | null; image: string | null };
}): CommentDTO {
  return {
    id: comment.id,
    body: comment.body,
    status: comment.status,
    createdAt: toIso(comment.createdAt),
    author: {
      id: comment.author.id,
      username: comment.author.username,
      name: comment.author.name,
      image: comment.author.image
    }
  };
}

export async function getPostDetail(postId: string, userId?: string): Promise<PostDetail | null> {
  const blockedIds = await getBlockedUserIdSet(userId);

  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      trip: true,
      sourceLinks: true,
      comments: {
        where: {
          status: "ACTIVE"
        },
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          comments: {
            where: {
              status: "ACTIVE"
            }
          }
        }
      }
    }
  });

  if (!post) return null;
  if (post.status !== "ACTIVE") return null;
  if (blockedIds.has(post.authorId)) return null;

  return {
    id: post.id,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    destinationLabel: post.destinationLabel,
    visibility: post.visibility,
    status: post.status,
    tags: post.tags,
    createdAt: toIso(post.createdAt),
    author: {
      id: post.author.id,
      username: post.author.username,
      name: post.author.name,
      image: post.author.image
    },
    trip: {
      id: post.trip.id,
      slug: post.trip.slug,
      title: post.trip.title
    },
    counts: {
      likes: post._count.likes,
      saves: post._count.saves,
      comments: post._count.comments
    },
    sourceLinks: post.sourceLinks.map((source) => ({
      url: source.url,
      domain: source.domain,
      title: source.title ?? undefined,
      description: source.description ?? undefined,
      thumbnailUrl: source.thumbnailUrl ?? undefined,
      parsedHints: source.parsedHints
    })),
    comments: post.comments.map(mapComment)
  };
}

export async function getPostsByUsername(username: string, viewerUserId?: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;
  let viewerFollows = false;
  let viewerBlocked = false;

  if (viewerUserId) {
    const blocked = await db.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerUserId, blockedId: user.id },
          { blockerId: user.id, blockedId: viewerUserId }
        ]
      }
    });

    if (blocked) {
      viewerBlocked = true;
      return {
        user,
        posts: [],
        savedPosts: [],
        viewerFollows,
        viewerBlocked
      };
    }

    if (viewerUserId !== user.id) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: viewerUserId,
            followeeId: user.id
          }
        }
      });
      viewerFollows = Boolean(follow);
    }
  }

  const includeUnlisted = viewerUserId === user.id;

  const posts = await db.post.findMany({
    where: {
      authorId: user.id,
      status: "ACTIVE",
      ...(includeUnlisted ? {} : { visibility: "PUBLIC" })
    },
    include: {
      author: true,
      trip: true,
      _count: {
        select: {
          likes: true,
          saves: true,
          comments: {
            where: {
              status: "ACTIVE"
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const mapped: PostSummary[] = posts.map((post) => ({
    id: post.id,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    destinationLabel: post.destinationLabel,
    visibility: post.visibility,
    status: post.status,
    tags: post.tags,
    createdAt: toIso(post.createdAt),
    author: {
      id: post.author.id,
      username: post.author.username,
      name: post.author.name,
      image: post.author.image
    },
    trip: {
      id: post.trip.id,
      slug: post.trip.slug,
      title: post.trip.title
    },
    counts: {
      likes: post._count.likes,
      saves: post._count.saves,
      comments: post._count.comments
    }
  }));

  const saved = await db.postSave.findMany({
    where: { userId: user.id },
    include: {
      post: {
        include: {
          author: true,
          trip: true,
          _count: {
            select: {
              likes: true,
              saves: true,
              comments: {
                where: {
                  status: "ACTIVE"
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const savedPosts: PostSummary[] = saved
    .map((entry) => entry.post)
    .filter((post) => post.status === "ACTIVE" && (includeUnlisted || post.visibility === "PUBLIC"))
    .map((post) => ({
      id: post.id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      destinationLabel: post.destinationLabel,
      visibility: post.visibility,
      status: post.status,
      tags: post.tags,
      createdAt: toIso(post.createdAt),
      author: {
        id: post.author.id,
        username: post.author.username,
        name: post.author.name,
        image: post.author.image
      },
      trip: {
        id: post.trip.id,
        slug: post.trip.slug,
        title: post.trip.title
      },
      counts: {
        likes: post._count.likes,
        saves: post._count.saves,
        comments: post._count.comments
      }
    }));

  return {
    user,
    posts: mapped,
    savedPosts,
    viewerFollows,
    viewerBlocked
  };
}

export async function getNotifications(userId: string, cursor?: string) {
  const notifications = await db.notification.findMany({
    where: {
      userId
    },
    take: PAGE_SIZE + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor
          }
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  const hasMore = notifications.length > PAGE_SIZE;
  const items: NotificationDTO[] = notifications.slice(0, PAGE_SIZE).map((item) => ({
    id: item.id,
    type: item.type,
    entityId: item.entityId,
    payload: (item.payload as Record<string, unknown> | null) ?? null,
    readAt: item.readAt ? toIso(item.readAt) : null,
    createdAt: toIso(item.createdAt)
  }));

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null
  };
}
