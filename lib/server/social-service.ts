import { db } from "@/lib/db";
import type { CommentDTO, PostDetail, PostSummary } from "@/lib/types";
import { computeFeedScore } from "@/lib/server/feed-ranker";

const PAGE_SIZE = 10;

function toIso(date: Date) {
  return date.toISOString();
}

export async function getFeed(cursor?: string) {
  const posts = await db.post.findMany({
    where: {
      status: "ACTIVE",
      visibility: "PUBLIC"
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
    take: PAGE_SIZE + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor
          }
        }
      : {}),
    orderBy: {
      createdAt: "desc"
    }
  });

  const hasMore = posts.length > PAGE_SIZE;
  const items = posts.slice(0, PAGE_SIZE);

  const ranked = [...items].sort(
    (a, b) =>
      computeFeedScore({
        createdAt: b.createdAt,
        likes: b._count.likes,
        comments: b._count.comments,
        saves: b._count.saves
      }) -
      computeFeedScore({
        createdAt: a.createdAt,
        likes: a._count.likes,
        comments: a._count.comments,
        saves: a._count.saves
      })
  );

  const feed: PostSummary[] = ranked.map((post) => ({
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
    items: feed,
    nextCursor: hasMore ? items[items.length - 1]?.id : null
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
      },
      likes: userId
        ? {
            where: {
              userId
            }
          }
        : false,
      saves: userId
        ? {
            where: {
              userId
            }
          }
        : false
    }
  });

  if (!post) return null;
  if (post.status !== "ACTIVE") return null;

  if (post.visibility === "UNLISTED" && !userId) {
    // Unlisted can be viewed publicly by direct URL; keep allowed.
  }

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

export async function getPostsByUsername(username: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;

  const posts = await db.post.findMany({
    where: {
      authorId: user.id,
      status: "ACTIVE"
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
    .filter((post) => post.status === "ACTIVE")
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
    savedPosts
  };
}
