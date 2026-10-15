import { describe, expect, it } from "vitest";
import { FIT_GAP_RESULT_LABELS, LEVEL_DESCRIPTIONS, LEVEL_LABELS, parseLevel } from "./constants";

describe("parseLevel", () => {
  it("reads a level from a number, a digit string or an L-prefixed string", () => {
    expect(parseLevel(3)).toBe(3);
    expect(parseLevel("3")).toBe(3);
    expect(parseLevel("L4")).toBe(4);
  });

  describe("known defects (P0-1, P2-11)", () => {
    // Anything unreadable becomes L1, the same fabricated rating as the API's clamp.
    it.fails("does not turn an unreadable level into L1", () => {
      expect(parseLevel("N/A")).toBeNull();
    });

    // A missing level throws (null.replace), which takes down the portfolio page.
    it.fails("treats a missing level as no level instead of throwing", () => {
      expect(parseLevel(null as unknown as string)).toBeNull();
    });
  });
});

describe("level and result labels", () => {
  it("has a label and a description for every level from 1 to 5", () => {
    for (const level of [1, 2, 3, 4, 5]) {
      expect(LEVEL_LABELS[level]).toBe(`L${level}`);
      expect(LEVEL_DESCRIPTIONS[level]).toBeTruthy();
    }
  });

  it("has a label for every fit/gap result the API can return", () => {
    expect(Object.keys(FIT_GAP_RESULT_LABELS).sort()).toEqual(["exceed", "gap", "match", "not_assessed"]);
  });
});
