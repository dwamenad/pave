import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMobileApiClient } from "../apps/mobile/src/lib/api-client";

describe("mobile api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deduplicates refresh calls when concurrent requests get 401", async () => {
    let storedTokens = {
      accessToken: "stale_access",
      refreshToken: "refresh_1"
    };
    let refreshCalls = 0;
    let setTokenCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const authHeader = new Headers(init?.headers || {}).get("authorization");

        if (url.endsWith("/api/mobile/auth/refresh")) {
          refreshCalls += 1;
          return new Response(
            JSON.stringify({
              accessToken: "fresh_access",
              refreshToken: "refresh_2",
              expiresInSeconds: 900
            }),
            { status: 200 }
          );
        }

        if (authHeader === "Bearer stale_access") {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        if (authHeader === "Bearer fresh_access") {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: "Unexpected request" }), { status: 500 });
      })
    );

    const client = createMobileApiClient({
      getTokens: () => storedTokens,
      setTokens: async (tokens) => {
        setTokenCalls += 1;
        storedTokens = tokens;
      },
      clearTokens: async () => {
        storedTokens = null as never;
      }
    });

    const [a, b] = await Promise.all([client.get<{ ok: boolean }>("/a"), client.get<{ ok: boolean }>("/b")]);

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(setTokenCalls).toBe(1);
    expect(storedTokens.accessToken).toBe("fresh_access");
  });

  it("clears local tokens when refresh fails", async () => {
    let storedTokens = {
      accessToken: "stale_access",
      refreshToken: "refresh_1"
    };
    let clearCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const authHeader = new Headers(init?.headers || {}).get("authorization");

        if (url.endsWith("/api/mobile/auth/refresh")) {
          return new Response(JSON.stringify({ error: "Invalid refresh token" }), { status: 401 });
        }

        if (authHeader === "Bearer stale_access") {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );

    const client = createMobileApiClient({
      getTokens: () => storedTokens,
      setTokens: async (tokens) => {
        storedTokens = tokens;
      },
      clearTokens: async () => {
        clearCalls += 1;
        storedTokens = null as never;
      }
    });

    await expect(client.get<{ ok: boolean }>("/a")).rejects.toThrow("Unauthorized");
    expect(clearCalls).toBe(1);
    expect(storedTokens).toBeNull();
  });
});
