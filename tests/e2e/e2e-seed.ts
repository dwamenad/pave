import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

const prisma = new PrismaClient();

export type E2ESeed = {
  userId: string;
  tripIds: string[];
  postIds: string[];
  primaryPostId: string;
  sessionToken: string;
};

export async function createE2ESeed(): Promise<E2ESeed> {
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-${suffix}@example.com`;

  const user = await prisma.user.create({
    data: {
      email,
      username: `e2e_${suffix}`,
      name: "E2E Traveler"
    }
  });

  const tripIds: string[] = [];
  const postIds: string[] = [];

  for (let i = 1; i <= 12; i += 1) {
    const trip = await prisma.trip.create({
      data: {
        slug: `e2e-trip-${suffix}-${i}`,
        title: `E2E Trip ${String(i).padStart(2, "0")}`,
        centerLat: 40.7128 + i * 0.0001,
        centerLng: -74.006 + i * 0.0001,
        authorId: user.id,
        days: {
          create: [{ dayIndex: 1 }]
        }
      },
      include: {
        days: true
      }
    });

    const day = trip.days[0];

    await prisma.tripItem.create({
      data: {
        tripDayId: day.id,
        placeId: `e2e-place-${suffix}-${i}`,
        name: `E2E Spot ${String(i).padStart(2, "0")}`,
        lat: 40.7128 + i * 0.0001,
        lng: -74.006 + i * 0.0001,
        category: "do",
        orderIndex: 0,
        notes: "E2E seeded activity"
      }
    });

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        tripId: trip.id,
        caption: `E2E seeded caption ${String(i).padStart(2, "0")}`,
        destinationLabel: `E2E Destination ${String(i).padStart(2, "0")}`,
        visibility: "PUBLIC",
        status: "ACTIVE",
        tags: ["e2e", "smoke"],
        createdAt: new Date(Date.now() - (12 - i) * 1000)
      }
    });

    tripIds.push(trip.id);
    postIds.push(post.id);
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for Playwright auth smoke tests.");
  }

  const sessionToken = await encode({
    secret,
    token: {
      sub: user.id,
      email,
      name: user.name || undefined
    },
    maxAge: 60 * 60
  });

  return {
    userId: user.id,
    tripIds,
    postIds,
    primaryPostId: postIds[0],
    sessionToken
  };
}

export async function destroyE2ESeed(seed: E2ESeed) {
  await prisma.postLike.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.postSave.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.comment.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.report.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.feedAction.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.feedImpression.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.postSourceLink.deleteMany({ where: { postId: { in: seed.postIds } } });
  await prisma.post.deleteMany({ where: { id: { in: seed.postIds } } });
  await prisma.trip.deleteMany({ where: { id: { in: seed.tripIds } } });
  await prisma.user.delete({ where: { id: seed.userId } });
}

export function createSessionCookie(seed: E2ESeed, baseURL: string) {
  const parsed = new URL(baseURL);
  return {
    name: "next-auth.session-token",
    value: seed.sessionToken,
    domain: parsed.hostname,
    httpOnly: true,
    sameSite: "Lax" as const,
    secure: parsed.protocol === "https:",
    path: "/"
  };
}
