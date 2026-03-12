import { PrismaClient } from "@prisma/client";
import { MOCK_NEARBY_RESULTS, type MockCityKey } from "../lib/mock/place-fixtures";
import { mockSocialParseMetadata } from "../lib/mock/ai-fixtures";

const prisma = new PrismaClient();

const users = [
  {
    email: "alex@pave.app",
    username: "alexrivero",
    name: "Alex Rivero",
    bio: "Weekend city-break planner and food-first traveler.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
  },
  {
    email: "maya@pave.app",
    username: "mayaatlas",
    name: "Maya Atlas",
    bio: "Slow travel, boutique stays, and coffee between museums.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
  },
  {
    email: "jordan@pave.app",
    username: "jordango",
    name: "Jordan Go",
    bio: "Group trip wrangler. Good with maps, better with dinner reservations.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
  },
  {
    email: "nina@pave.app",
    username: "ninalocal",
    name: "Nina Local",
    bio: "Collecting coffee shops, walkable neighborhoods, and scenic first days.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80"
  }
] as const;

const tripBlueprints = [
  { slug: "lisbon-food-club", title: "Lisbon Food Club", city: "lisbon", authorEmail: "alex@pave.app" },
  { slug: "tokyo-first-timer-circuit", title: "Tokyo First-Timer Circuit", city: "tokyo", authorEmail: "alex@pave.app" },
  { slug: "cdmx-weekend-color", title: "CDMX Weekend in Color", city: "mexico_city", authorEmail: "alex@pave.app" },
  { slug: "lisbon-slow-couple-break", title: "Lisbon Slow Couple Break", city: "lisbon", authorEmail: "maya@pave.app" },
  { slug: "tokyo-design-walk", title: "Tokyo Design Walk", city: "tokyo", authorEmail: "maya@pave.app" },
  { slug: "cdmx-art-late-lunch", title: "CDMX Art + Late Lunch", city: "mexico_city", authorEmail: "maya@pave.app" },
  { slug: "lisbon-group-birthday-loop", title: "Lisbon Group Birthday Loop", city: "lisbon", authorEmail: "jordan@pave.app" },
  { slug: "tokyo-night-and-noodles", title: "Tokyo Night and Noodles", city: "tokyo", authorEmail: "jordan@pave.app" },
  { slug: "cdmx-budget-friends-run", title: "CDMX Budget Friends Run", city: "mexico_city", authorEmail: "jordan@pave.app" },
  { slug: "lisbon-coffee-and-tiles", title: "Lisbon Coffee and Tiles", city: "lisbon", authorEmail: "nina@pave.app" },
  { slug: "tokyo-culture-balance", title: "Tokyo Culture Balance", city: "tokyo", authorEmail: "nina@pave.app" },
  { slug: "cdmx-roma-to-polanco", title: "CDMX Roma to Polanco", city: "mexico_city", authorEmail: "nina@pave.app" }
] as const;

function sourceLinksForCity(city: MockCityKey, index: number) {
  const base = mockSocialParseMetadata[index % mockSocialParseMetadata.length];
  return [
    {
      url: `${base.url}?city=${city}&slot=${index}`,
      domain: "example.com",
      title: base.title,
      description: base.description,
      thumbnailUrl: null,
      parsedHints: [...base.parsedHints, city.replace("_", " ")]
    }
  ];
}

function cityDays(city: MockCityKey) {
  const buckets = MOCK_NEARBY_RESULTS[city];
  const stay = buckets.stay[0] || null;
  const dayOne = [buckets.do[0], buckets.eat[0], stay].filter(Boolean);
  const dayTwo = [buckets.eat[1] || buckets.eat[0], buckets.do[1] || buckets.do[0], buckets.eat[2] || buckets.eat[0]].filter(Boolean);

  return [dayOne, dayTwo].map((items, dayIndex) => ({
    dayIndex: dayIndex + 1,
    items: items.map((item, index) => ({
      placeId: item!.placeId,
      name: item!.name,
      lat: item!.lat,
      lng: item!.lng,
      category: item!.types.includes("lodging") ? "stay" : item!.types.includes("restaurant") || item!.types.includes("cafe") || item!.types.includes("bakery") ? "eat" : "do",
      orderIndex: index,
      notes:
        dayIndex === 0
          ? "Seeded from the local demo network to keep create, feed, and remix flows realistic."
          : "Socially discovered stop with a compact route around the trip center."
    }))
  }));
}

async function main() {
  const userMap = new Map<string, { id: string }>();

  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        name: user.name,
        bio: user.bio,
        image: user.image,
        preferences: {
          homeBase: "remote",
          favoriteTripStyle: "city-break",
          prefersWalkableRoutes: true
        }
      },
      create: {
        email: user.email,
        username: user.username,
        name: user.name,
        bio: user.bio,
        image: user.image,
        preferences: {
          homeBase: "remote",
          favoriteTripStyle: "city-break",
          prefersWalkableRoutes: true
        }
      },
      select: { id: true }
    });

    userMap.set(user.email, record);
  }

  await prisma.tripRemix.deleteMany({
    where: {
      OR: [
        { sourceTrip: { slug: { in: tripBlueprints.map((trip) => trip.slug) } } },
        { remixedTrip: { slug: { in: tripBlueprints.map((trip) => trip.slug) } } }
      ]
    }
  });
  await prisma.trip.deleteMany({ where: { slug: { in: [...tripBlueprints.map((trip) => trip.slug), "accra-weekend-sample"] } } });

  const tripMap = new Map<string, { id: string; slug: string }>();
  const postMap = new Map<string, { id: string; tripId: string }>();

  for (let index = 0; index < tripBlueprints.length; index += 1) {
    const blueprint = tripBlueprints[index];
    const author = userMap.get(blueprint.authorEmail);
    if (!author) continue;

    const destination = MOCK_NEARBY_RESULTS[blueprint.city].destination[0];
    const trip = await prisma.trip.create({
      data: {
        slug: blueprint.slug,
        title: blueprint.title,
        centerLat: destination.lat,
        centerLng: destination.lng,
        placeId: destination.placeId,
        authorId: author.id,
        isPublic: true,
        days: {
          create: cityDays(blueprint.city).map((day) => ({
            dayIndex: day.dayIndex,
            items: {
              create: day.items
            }
          }))
        }
      },
      select: { id: true, slug: true }
    });

    tripMap.set(trip.slug, trip);

    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        tripId: trip.id,
        caption: `${blueprint.title} started as saved travel inspiration and ended up as a usable city itinerary in Pave.`,
        mediaUrl: null,
        visibility: "PUBLIC",
        destinationLabel: destination.name,
        status: "ACTIVE",
        tags: [blueprint.city.replace("_", "-"), "city-break", "seeded-demo"],
        sourceLinks: {
          create: sourceLinksForCity(blueprint.city, index)
        }
      },
      select: { id: true, tripId: true }
    });

    postMap.set(trip.slug, post);
  }

  const followPairs = [
    ["alex@pave.app", "maya@pave.app"],
    ["alex@pave.app", "jordan@pave.app"],
    ["maya@pave.app", "nina@pave.app"],
    ["jordan@pave.app", "alex@pave.app"],
    ["nina@pave.app", "alex@pave.app"]
  ] as const;

  for (const [followerEmail, followeeEmail] of followPairs) {
    const follower = userMap.get(followerEmail);
    const followee = userMap.get(followeeEmail);
    if (!follower || !followee) continue;

    await prisma.follow.upsert({
      where: {
        followerId_followeeId: {
          followerId: follower.id,
          followeeId: followee.id
        }
      },
      update: {},
      create: {
        followerId: follower.id,
        followeeId: followee.id
      }
    });
  }

  const savePairs = [
    ["maya@pave.app", "lisbon-food-club"],
    ["jordan@pave.app", "tokyo-design-walk"],
    ["nina@pave.app", "cdmx-weekend-color"],
    ["alex@pave.app", "lisbon-coffee-and-tiles"]
  ] as const;

  for (const [userEmail, tripSlug] of savePairs) {
    const user = userMap.get(userEmail);
    const post = postMap.get(tripSlug);
    if (!user || !post) continue;

    await prisma.postSave.upsert({
      where: {
        postId_userId: {
          postId: post.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        postId: post.id,
        userId: user.id
      }
    });
  }

  const comments = [
    { authorEmail: "maya@pave.app", tripSlug: "lisbon-food-club", body: "This is exactly the kind of compact Lisbon loop I would send to a group chat." },
    { authorEmail: "jordan@pave.app", tripSlug: "tokyo-first-timer-circuit", body: "Good pacing here. I would keep the first-night food stop exactly where it is." },
    { authorEmail: "nina@pave.app", tripSlug: "cdmx-art-late-lunch", body: "The route between the museum and lunch feels really usable." },
    { authorEmail: "alex@pave.app", tripSlug: "tokyo-culture-balance", body: "Strong mix of anchor stops and recovery time." }
  ] as const;

  for (const comment of comments) {
    const author = userMap.get(comment.authorEmail);
    const post = postMap.get(comment.tripSlug);
    if (!author || !post) continue;

    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: author.id,
        body: comment.body,
        status: "ACTIVE"
      }
    });
  }

  const remixes = [
    { sourceSlug: "lisbon-food-club", remixedSlug: "lisbon-group-birthday-loop", userEmail: "jordan@pave.app" },
    { sourceSlug: "tokyo-design-walk", remixedSlug: "tokyo-culture-balance", userEmail: "nina@pave.app" }
  ] as const;

  for (const remix of remixes) {
    const sourceTrip = tripMap.get(remix.sourceSlug);
    const remixedTrip = tripMap.get(remix.remixedSlug);
    const user = userMap.get(remix.userEmail);
    if (!sourceTrip || !remixedTrip || !user) continue;

    await prisma.tripRemix.upsert({
      where: {
        sourceTripId_remixedTripId: {
          sourceTripId: sourceTrip.id,
          remixedTripId: remixedTrip.id
        }
      },
      update: {
        remixedById: user.id
      },
      create: {
        sourceTripId: sourceTrip.id,
        remixedTripId: remixedTrip.id,
        remixedById: user.id
      }
    });
  }

  console.log(`Seeded ${userMap.size} users, ${tripMap.size} trips, and ${postMap.size} published posts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
