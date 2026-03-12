import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("provider selection", () => {
  it("uses the mock places provider only when explicitly enabled", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        USE_MOCK_PLACES_PROVIDER: true
      }
    }));

    const module = await import("@/lib/providers");
    expect(module.mockPlacesProviderEnabled).toBe(true);
    expect(module.placesProvider.constructor.name).toBe("MockPlacesProvider");
  });

  it("uses the google provider when mock mode is disabled", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        USE_MOCK_PLACES_PROVIDER: false
      }
    }));

    const module = await import("@/lib/providers");
    expect(module.mockPlacesProviderEnabled).toBe(false);
    expect(module.placesProvider.constructor.name).toBe("GooglePlacesProvider");
  });
});
