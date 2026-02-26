import { describe, expect, it } from "vitest";
import { containsProfanity, sanitizeToTags } from "@/lib/server/moderation";

describe("moderation", () => {
  it("detects profanity", () => {
    expect(containsProfanity("this is shit")).toBe(true);
    expect(containsProfanity("family trip")).toBe(false);
  });

  it("normalizes tags", () => {
    expect(sanitizeToTags([" Food ", "Art", "", "night-life"])).toEqual(["food", "art", "night-life"]);
  });
});
