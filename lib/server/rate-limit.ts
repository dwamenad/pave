import { NextRequest } from "next/server";
import { env } from "@/lib/env";

type Bucket = { count: number; resetAt: number };

type RateLimitOk = { ok: true; mode: "local" | "upstash" };
type RateLimitLimited = {
  ok: false;
  mode: "local" | "upstash";
  retryAfterMs: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function withLocalLimit(ip: string): RateLimitOk | RateLimitLimited {
  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || existing.resetAt < now) {
    buckets.set(ip, {
      count: 1,
      resetAt: now + env.RATE_LIMIT_WINDOW_MS
    });
    return { ok: true, mode: "local" };
  }

  existing.count += 1;

  if (existing.count > env.RATE_LIMIT_MAX_REQUESTS) {
    return {
      ok: false,
      mode: "local",
      retryAfterMs: Math.max(500, existing.resetAt - now)
    };
  }

  return { ok: true, mode: "local" };
}

async function runUpstashCommand(path: string) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`upstash_status_${response.status}`);
  }

  const payload = (await response.json()) as { result?: unknown };
  return payload.result;
}

async function withUpstashLimit(ip: string): Promise<RateLimitOk | RateLimitLimited | null> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const key = encodeURIComponent(`ratelimit:${ip}`);
  const windowMs = Math.max(1000, env.RATE_LIMIT_WINDOW_MS);

  try {
    const countRaw = await runUpstashCommand(`incr/${key}`);
    const count = Number(countRaw || 0);

    if (count === 1) {
      await runUpstashCommand(`pexpire/${key}/${windowMs}`);
    }

    if (count > env.RATE_LIMIT_MAX_REQUESTS) {
      const ttlRaw = await runUpstashCommand(`pttl/${key}`);
      const retryAfterMs = Math.max(500, Number(ttlRaw || windowMs));
      return { ok: false, mode: "upstash", retryAfterMs };
    }

    return { ok: true, mode: "upstash" };
  } catch {
    return null;
  }
}

export async function rateLimit(request: NextRequest) {
  const ip = getClientIp(request);
  const distributed = await withUpstashLimit(ip);
  if (distributed) return distributed;
  return withLocalLimit(ip);
}
