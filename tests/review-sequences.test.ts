import { describe, expect, it } from "vitest";

import {
  EASY_INTERVALS,
  HARD_INTERVALS,
  NORMAL_INTERVALS,
  getReviewIntervals,
} from "../src/core/review-sequences.js";

describe("fixed review sequences", () => {
  it("defines the approved Normal sequence", () => {
    expect(NORMAL_INTERVALS).toEqual([1, 3, 7, 15]);
  });

  it("defines the approved Hard sequence", () => {
    expect(HARD_INTERVALS).toEqual([1, 3, 5, 10, 20]);
  });

  it("defines the approved Easy sequence", () => {
    expect(EASY_INTERVALS).toEqual([3, 7, 15]);
  });

  it("returns the sequence for each scheduling mode", () => {
    expect(getReviewIntervals("normal")).toBe(NORMAL_INTERVALS);
    expect(getReviewIntervals("hard")).toBe(HARD_INTERVALS);
    expect(getReviewIntervals("easy")).toBe(EASY_INTERVALS);
  });

  it("keeps the sequences separate", () => {
    expect(NORMAL_INTERVALS).not.toBe(HARD_INTERVALS);
    expect(NORMAL_INTERVALS).not.toBe(EASY_INTERVALS);
    expect(HARD_INTERVALS).not.toBe(EASY_INTERVALS);
  });
});
