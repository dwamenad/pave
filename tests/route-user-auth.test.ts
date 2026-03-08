import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/server/mobile-route-user", () => ({
  resolveMobileActor: vi.fn()
}));

import { getCurrentUser } from "@/lib/auth";
import { resolveMobileActor } from "@/lib/server/mobile-route-user";
import { getApiActor, requireApiUser } from "@/lib/server/route-user";

describe("route user auth resolution", () => {
  const request = new NextRequest("http://localhost:3000/api/feed");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers mobile bearer actor when available", async () => {
    const mobileUser = { id: "u_mobile", email: "mobile@example.com" };
    vi.mocked(resolveMobileActor).mockResolvedValue({
      user: mobileUser as never,
      session: { id: "s1" } as never,
      error: null
    });
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u_web" } as never);

    const actor = await getApiActor(request);
    expect(actor?.authMode).toBe("mobile");
    expect(actor?.user.id).toBe("u_mobile");
  });

  it("falls back to web session actor when bearer is not present", async () => {
    vi.mocked(resolveMobileActor).mockResolvedValue({
      user: null,
      session: null,
      error: "Missing bearer token"
    });
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u_web" } as never);

    const actor = await getApiActor(request);
    expect(actor?.authMode).toBe("web");
    expect(actor?.user.id).toBe("u_web");
  });

  it("returns unauthorized response when neither actor is available", async () => {
    vi.mocked(resolveMobileActor).mockResolvedValue({
      user: null,
      session: null,
      error: "Invalid access token"
    });
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const result = await requireApiUser(request);
    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);
  });
});
