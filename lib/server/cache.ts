import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CacheState = "hit" | "stale" | "miss";

export type CacheLookup<T> = {
  value: T | null;
  cacheState: CacheState;
  fetchedAt: string | null;
};

export async function getPlaceCache<T>(placeId: string, ttlHours = 24): Promise<CacheLookup<T>> {
  const row = await db.placeCache.findUnique({ where: { placeId } });
  if (!row) {
    return { value: null, cacheState: "miss", fetchedAt: null };
  }

  const age = Date.now() - row.fetchedAt.getTime();
  return {
    value: row.json as T,
    cacheState: age > ttlHours * 60 * 60 * 1000 ? "stale" : "hit",
    fetchedAt: row.fetchedAt.toISOString()
  };
}

export async function setPlaceCache(placeId: string, json: unknown) {
  const payload = json as Prisma.InputJsonValue;
  await db.placeCache.upsert({
    where: { placeId },
    create: { placeId, json: payload, fetchedAt: new Date() },
    update: { json: payload, fetchedAt: new Date() }
  });
}

export async function getNearbyCache<T>(cacheKey: string, ttlHours = 6): Promise<CacheLookup<T>> {
  const row = await db.nearbyCache.findUnique({ where: { cacheKey } });
  if (!row) {
    return { value: null, cacheState: "miss", fetchedAt: null };
  }

  const age = Date.now() - row.fetchedAt.getTime();
  return {
    value: row.json as T,
    cacheState: age > ttlHours * 60 * 60 * 1000 ? "stale" : "hit",
    fetchedAt: row.fetchedAt.toISOString()
  };
}

export async function setNearbyCache(cacheKey: string, json: unknown) {
  const payload = json as Prisma.InputJsonValue;
  await db.nearbyCache.upsert({
    where: { cacheKey },
    create: { cacheKey, json: payload, fetchedAt: new Date() },
    update: { json: payload, fetchedAt: new Date() }
  });
}
