import { describe, expect, it } from "vitest";
import { extractUrlHints } from "@/lib/server/link-metadata";

describe("link metadata helpers", () => {
  it("extracts useful URL hints", () => {
    const hints = extractUrlHints("https://www.instagram.com/reel/paris-food-guide-2026/");
    expect(hints).toContain("instagram");
    expect(hints).toContain("paris");
    expect(hints).toContain("food");
  });
});
