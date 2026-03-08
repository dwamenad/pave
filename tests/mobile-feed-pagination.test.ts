import { describe, expect, it } from "vitest";
import { mergeUniqueFeedItems } from "../apps/mobile/src/lib/feed-pagination";

describe("mergeUniqueFeedItems", () => {
  it("keeps stable order and removes duplicates by id", () => {
    const merged = mergeUniqueFeedItems([
      {
        items: [
          { id: "a", label: "first a" },
          { id: "b", label: "b" }
        ]
      },
      {
        items: [
          { id: "b", label: "second b" },
          { id: "c", label: "c" }
        ]
      }
    ]);

    expect(merged.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(merged[1]?.label).toBe("b");
  });
});
