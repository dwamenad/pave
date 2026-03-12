import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null)
}));

vi.mock("@/lib/server/link-metadata", () => ({
  fetchMetadataForLinks: vi.fn().mockResolvedValue([])
}));

vi.mock("@/lib/social-parse", () => ({
  parseSocialIntent: vi.fn()
}));

import { POST } from "@/app/api/social/parse/route";
import { parseSocialIntent } from "@/lib/social-parse";

describe("social parse route", () => {
  it("returns a stable code when parsing degrades", async () => {
    vi.mocked(parseSocialIntent).mockResolvedValue({
      hints: ["Lisbon"],
      ambiguous: [],
      resolution: "degraded",
      code: "provider_unavailable",
      mockMode: true
    });

    const request = new NextRequest("http://localhost/api/social/parse", {
      method: "POST",
      body: JSON.stringify({ input: "Weekend in Lisbon", links: [] })
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.code).toBe("provider_unavailable");
    expect(json.resolution).toBe("degraded");
    expect(json.mockMode).toBe(true);
  });
});
