import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("runtime readiness", () => {
  it("treats maps as degraded without failing the core readiness baseline", async () => {
    vi.doMock("@/package.json", () => ({
      default: { version: "0.2.1" }
    }));
    vi.doMock("@/lib/env", () => ({
      env: {
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "client",
        GOOGLE_CLIENT_SECRET: "secret",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        GOOGLE_MAPS_API_KEY_PUBLIC: "",
        GOOGLE_MAPS_API_KEY_SERVER: "",
        ENABLE_AI_CREATE: false,
        OPENAI_API_KEY: "",
        OPENAI_RESPONSES_MODEL: "gpt-4.1-mini",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: ""
      }
    }));
    vi.doMock("@/lib/db", () => ({
      db: {
        $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }])
      }
    }));

    const { getRuntimeReadiness } = await import("@/lib/server/runtime-readiness");
    const report = await getRuntimeReadiness();

    expect(report.ok).toBe(true);
    expect(report.database.ready).toBe(true);
    expect(report.subsystems.auth.ready).toBe(true);
    expect(report.subsystems.maps.ready).toBe(false);
    expect(report.subsystems.rateLimiting.mode).toBe("local");
  });

  it("fails readiness when database connectivity is unavailable", async () => {
    vi.doMock("@/package.json", () => ({
      default: { version: "0.2.1" }
    }));
    vi.doMock("@/lib/env", () => ({
      env: {
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "client",
        GOOGLE_CLIENT_SECRET: "secret",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        GOOGLE_MAPS_API_KEY_PUBLIC: "pub",
        GOOGLE_MAPS_API_KEY_SERVER: "server",
        ENABLE_AI_CREATE: false,
        OPENAI_API_KEY: "",
        OPENAI_RESPONSES_MODEL: "gpt-4.1-mini",
        UPSTASH_REDIS_REST_URL: "https://us1-real-upstash-host.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token"
      }
    }));
    vi.doMock("@/lib/db", () => ({
      db: {
        $queryRaw: vi.fn().mockRejectedValue(new Error("db down"))
      }
    }));

    const { getRuntimeReadiness } = await import("@/lib/server/runtime-readiness");
    const report = await getRuntimeReadiness();

    expect(report.ok).toBe(false);
    expect(report.database.ready).toBe(false);
    expect(report.subsystems.rateLimiting.mode).toBe("upstash");
  });

  it("treats placeholder auth values as not ready", async () => {
    vi.doMock("@/package.json", () => ({
      default: { version: "0.2.1" }
    }));
    vi.doMock("@/lib/env", () => ({
      env: {
        NEXTAUTH_SECRET: "replace_with_32_plus_char_random_string",
        GOOGLE_CLIENT_ID: "your_google_oauth_client_id",
        GOOGLE_CLIENT_SECRET: "your_google_oauth_client_secret",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        GOOGLE_MAPS_API_KEY_PUBLIC: "your_referrer_restricted_maps_js_key",
        GOOGLE_MAPS_API_KEY_SERVER: "your_server_restricted_places_key",
        ENABLE_AI_CREATE: false,
        OPENAI_API_KEY: "",
        OPENAI_RESPONSES_MODEL: "gpt-4.1-mini",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: ""
      }
    }));
    vi.doMock("@/lib/db", () => ({
      db: {
        $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }])
      }
    }));

    const { getRuntimeReadiness } = await import("@/lib/server/runtime-readiness");
    const report = await getRuntimeReadiness();

    expect(report.ok).toBe(false);
    expect(report.database.ready).toBe(true);
    expect(report.subsystems.auth.ready).toBe(false);
    expect(report.subsystems.maps.ready).toBe(false);
  });
});
