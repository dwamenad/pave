import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

type Bucket = { count: number; resetAt: number };

type RateLimitOk = { ok: true; mode: "local" | "upstash" };
type RateLimitLimited = {
  ok: false;
  mode: "local" | "upstash";
  retryAfterMs: number;
};

const buckets = new Map<string, Bucket>();

export const RATE_LIMIT_POLICIES = {
  default: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS
  },
  social_action: {
    windowMs: 60_000,
    maxRequests: 120
  },
  user_content: {
    windowMs: 60_000,
    maxRequests: 20
  },
  reports: {
    windowMs: 60_000,
    maxRequests: 8
  },
  provider_lookup: {
    windowMs: 60_000,
    maxRequests: 18
  },
  ai_draft: {
    windowMs: 60_000,
    maxRequests: 6
  },
  export: {
    windowMs: 60_000,
    maxRequests: 6
  }
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;

type RateLimitOptions = {
  policy?: RateLimitPolicyName;
  identifier?: string;
};

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function withLocalLimit(key: string, policy: RateLimitPolicyName): RateLimitOk | RateLimitLimited {
  const now = Date.now();
  const existing = buckets.get(key);
  const config = RATE_LIMIT_POLICIES[policy];

  if (!existing || existing.resetAt < now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    });
    return { ok: true, mode: "local" };
  }

  existing.count += 1;

  if (existing.count > config.maxRequests) {
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

async function withUpstashLimit(key: string, policy: RateLimitPolicyName): Promise<RateLimitOk | RateLimitLimited | null> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const encodedKey = encodeURIComponent(`ratelimit:${key}`);
  const config = RATE_LIMIT_POLICIES[policy];
  const windowMs = Math.max(1000, config.windowMs);

  try {
    const countRaw = await runUpstashCommand(`incr/${encodedKey}`);
    const count = Number(countRaw || 0);

    if (count === 1) {
      await runUpstashCommand(`pexpire/${encodedKey}/${windowMs}`);
    }

    if (count > config.maxRequests) {
      const ttlRaw = await runUpstashCommand(`pttl/${encodedKey}`);
      const retryAfterMs = Math.max(500, Number(ttlRaw || windowMs));
      return { ok: false, mode: "upstash", retryAfterMs };
    }

    return { ok: true, mode: "upstash" };
  } catch {
    return null;
  }
}

function buildRateLimitKey(request: NextRequest, options?: RateLimitOptions) {
  const policy = options?.policy ?? "default";
  const keySource = options?.identifier?.trim() || getClientIp(request);
  return { key: `${policy}:${keySource}`, policy };
}

export async function rateLimit(request: NextRequest, options?: RateLimitOptions) {
  const { key, policy } = buildRateLimitKey(request, options);
  const distributed = await withUpstashLimit(key, policy);
  if (distributed) return distributed;
  return withLocalLimit(key, policy);
}

export async function enforceRateLimit(request: NextRequest, options?: RateLimitOptions) {
  const ip = getClientIp(request);
  const limited = await rateLimit(request, options);
  if (limited.ok) return null;

  return NextResponse.json(
    {
      error: "Too many requests",
      code: "rate_limited",
      retryAfterMs: limited.retryAfterMs,
      limiterMode: limited.mode,
      identifier: options?.identifier ? "actor" : "network",
      clientIp: ip === "local" ? ip : undefined
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(limited.retryAfterMs / 1000)))
      }
    }
  );
}
