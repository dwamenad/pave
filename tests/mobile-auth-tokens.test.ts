import { beforeAll, describe, expect, it } from "vitest";

let tokensModule: typeof import("@/lib/server/mobile-auth-tokens");

beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/one_click_away?schema=public";
  process.env.MOBILE_AUTH_JWT_SECRET = "test_mobile_secret_value";
  process.env.NEXTAUTH_SECRET = "test_nextauth_secret";
  tokensModule = await import("@/lib/server/mobile-auth-tokens");
});

describe("mobile auth token utilities", () => {
  it("signs and verifies access tokens", () => {
    const token = tokensModule.signAccessToken({
      userId: "user_1",
      sessionId: "session_1",
      jti: "jti_1",
      refreshTokenVersion: 2,
      ttlMinutes: 30
    });

    const claims = tokensModule.verifyAccessToken(token);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("user_1");
    expect(claims?.sid).toBe("session_1");
    expect(claims?.jti).toBe("jti_1");
    expect(claims?.ver).toBe(2);
  });

  it("rejects tampered tokens", () => {
    const token = tokensModule.signAccessToken({
      userId: "user_2",
      sessionId: "session_2",
      jti: "jti_2",
      refreshTokenVersion: 1,
      ttlMinutes: 30
    });

    const parts = token.split(".");
    const tamperedPayload = `${parts[1].slice(0, -1)}${parts[1].endsWith("a") ? "b" : "a"}`;
    const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    expect(tokensModule.verifyAccessToken(tampered)).toBeNull();
  });

  it("creates deterministic token hashes", () => {
    const a = tokensModule.hashRefreshToken("refresh_token");
    const b = tokensModule.hashRefreshToken("refresh_token");
    const c = tokensModule.hashRefreshToken("refresh_token_other");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("generates opaque tokens", () => {
    const a = tokensModule.generateOpaqueToken(32);
    const b = tokensModule.generateOpaqueToken(32);
    expect(a.length).toBeGreaterThan(10);
    expect(a).not.toBe(b);
  });
});
