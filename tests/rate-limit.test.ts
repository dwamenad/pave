import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("rate-limit policy map", () => {
  it("exposes the expected route-specific policy buckets", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        RATE_LIMIT_WINDOW_MS: 60_000,
        RATE_LIMIT_MAX_REQUESTS: 60,
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: ""
      }
    }));

    const { RATE_LIMIT_POLICIES } = await import("@/lib/server/rate-limit");

    expect(RATE_LIMIT_POLICIES.default.maxRequests).toBe(60);
    expect(RATE_LIMIT_POLICIES.social_action.maxRequests).toBe(120);
    expect(RATE_LIMIT_POLICIES.user_content.maxRequests).toBe(20);
    expect(RATE_LIMIT_POLICIES.reports.maxRequests).toBe(8);
    expect(RATE_LIMIT_POLICIES.provider_lookup.maxRequests).toBe(18);
    expect(RATE_LIMIT_POLICIES.ai_draft.maxRequests).toBe(6);
    expect(RATE_LIMIT_POLICIES.export.maxRequests).toBe(6);
  });

  it("keeps expensive provider-backed actions stricter than social actions", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        RATE_LIMIT_WINDOW_MS: 60_000,
        RATE_LIMIT_MAX_REQUESTS: 60,
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: ""
      }
    }));

    const { RATE_LIMIT_POLICIES } = await import("@/lib/server/rate-limit");

    expect(RATE_LIMIT_POLICIES.provider_lookup.maxRequests).toBeLessThan(RATE_LIMIT_POLICIES.social_action.maxRequests);
    expect(RATE_LIMIT_POLICIES.ai_draft.maxRequests).toBeLessThanOrEqual(RATE_LIMIT_POLICIES.provider_lookup.maxRequests);
    expect(RATE_LIMIT_POLICIES.export.maxRequests).toBeLessThanOrEqual(RATE_LIMIT_POLICIES.user_content.maxRequests);
  });
});
