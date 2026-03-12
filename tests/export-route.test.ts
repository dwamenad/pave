import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { mockedDb } = vi.hoisted(() => ({
  mockedDb: {
    trip: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/db", () => ({
  db: mockedDb
}));

vi.mock("@/lib/server/export-service", () => ({
  buildTripPdfBytes: vi.fn(),
  createExportRecord: vi.fn(),
  markExportFailed: vi.fn(),
  markExportSuccess: vi.fn()
}));

vi.mock("@/lib/server/route-user", () => ({
  requireApiUser: vi.fn()
}));

vi.mock("@/lib/server/rate-limit", () => ({
  enforceRateLimit: vi.fn()
}));

vi.mock("@/lib/server/observability", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/observability")>("@/lib/server/observability");
  return {
    ...actual,
    captureServerException: vi.fn()
  };
});

import { POST } from "@/app/api/trips/[tripId]/export/pdf/route";
import { buildTripPdfBytes, createExportRecord, markExportFailed } from "@/lib/server/export-service";
import { captureServerException } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireApiUser } from "@/lib/server/route-user";

describe("trip export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks export records as failed and returns safe JSON when export generation fails", async () => {
    vi.mocked(requireApiUser).mockResolvedValue({
      user: { id: "user_1" },
      response: null
    } as never);
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    mockedDb.trip.findUnique.mockResolvedValue(null);

    const response = await POST(new NextRequest("http://localhost/api/trips/trip_1/export/pdf", { method: "POST" }), {
      params: { tripId: "trip_1" }
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.code).toBe("trip_not_found");
    expect(createExportRecord).not.toHaveBeenCalled();
    expect(markExportFailed).not.toHaveBeenCalled();
    expect(captureServerException).not.toHaveBeenCalled();
  });

  it("returns the limiter response untouched when export requests are throttled", async () => {
    vi.mocked(requireApiUser).mockResolvedValue({
      user: { id: "user_1" },
      response: null
    } as never);
    mockedDb.trip.findUnique.mockResolvedValue({ id: "trip_1" });
    vi.mocked(enforceRateLimit).mockResolvedValue(
      NextResponse.json({ error: "Too many requests", code: "rate_limited" }, { status: 429 })
    );

    const response = await POST(new NextRequest("http://localhost/api/trips/trip_1/export/pdf", { method: "POST" }), {
      params: { tripId: "trip_1" }
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ code: "rate_limited" });
  });
});
