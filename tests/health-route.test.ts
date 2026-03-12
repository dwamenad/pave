import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/runtime-readiness", () => ({
  getRuntimeReadiness: vi.fn()
}));

import { GET } from "@/app/api/health/route";
import { getRuntimeReadiness } from "@/lib/server/runtime-readiness";

describe("health route", () => {
  it("returns 200 when the readiness baseline is healthy", async () => {
    vi.mocked(getRuntimeReadiness).mockResolvedValue({
      ok: true,
      version: "0.2.1",
      environment: "test",
      checkedAt: "2026-03-12T12:00:00.000Z",
      database: { ready: true },
      subsystems: {
        auth: { ready: true },
        maps: { ready: false },
        aiCreate: { ready: true, enabled: false },
        mobileTelemetry: { ready: false },
        rateLimiting: { ready: true, mode: "local" }
      }
    });

    const response = await GET(new NextRequest("http://localhost/api/health"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, database: { ready: true } });
  });

  it("returns 503 when the readiness baseline is degraded", async () => {
    vi.mocked(getRuntimeReadiness).mockResolvedValue({
      ok: false,
      version: "0.2.1",
      environment: "test",
      checkedAt: "2026-03-12T12:00:00.000Z",
      database: { ready: false },
      subsystems: {
        auth: { ready: false },
        maps: { ready: false },
        aiCreate: { ready: false, enabled: true },
        mobileTelemetry: { ready: false },
        rateLimiting: { ready: true, mode: "local" }
      }
    });

    const response = await GET(new NextRequest("http://localhost/api/health"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ok: false, database: { ready: false } });
  });
});
