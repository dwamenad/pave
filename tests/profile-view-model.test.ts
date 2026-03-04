import { describe, expect, it } from "vitest";
import { normalizeProfileTab } from "@/lib/profile-view-model";

describe("profile view model", () => {
  it("normalizes supported tabs", () => {
    expect(normalizeProfileTab("posts")).toBe("posts");
    expect(normalizeProfileTab("saved")).toBe("saved");
  });

  it("falls back to posts for unknown values", () => {
    expect(normalizeProfileTab()).toBe("posts");
    expect(normalizeProfileTab("invalid")).toBe("posts");
  });
});
