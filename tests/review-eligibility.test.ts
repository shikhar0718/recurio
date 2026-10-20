import { describe, expect, it } from "vitest";

import { assertReviewEligible } from "../src/core/review-eligibility.js";
import type { SchedulingState } from "../src/core/scheduling-types.js";

const state: SchedulingState = {
  currentMode: "normal",
  lastAssignment: { mode: "normal", position: 0, days: 1 },
  nextDueDate: "2026-10-20",
  reviewHistory: {
    completedReviewCount: 0,
    hasEasyReview: false,
    hasHardReview: false,
  },
  isMastered: false,
};

describe("review eligibility", () => {
  it("allows a review on the due date", () => {
    expect(() => assertReviewEligible(state, "2026-10-20")).not.toThrow();
  });

  it("allows overdue reviews", () => {
    expect(() => assertReviewEligible(state, "2026-10-25")).not.toThrow();
  });

  it("rejects early reviews", () => {
    expect(() => assertReviewEligible(state, "2026-10-19")).toThrow(
      "Review is early",
    );
  });

  it("rejects scheduled reviews for mastered topics", () => {
    expect(() =>
      assertReviewEligible(
        { ...state, isMastered: true, nextDueDate: null },
        "2026-10-20",
      ),
    ).toThrow("Mastered topics");
  });

  it("rejects an unmastered topic without a due date", () => {
    expect(() =>
      assertReviewEligible({ ...state, nextDueDate: null }, "2026-10-20"),
    ).toThrow("Unmastered scheduling states");
  });

  it("rejects an invalid interval assignment", () => {
    expect(() =>
      assertReviewEligible(
        {
          ...state,
          lastAssignment: { mode: "normal", position: 0, days: 3 },
        },
        "2026-10-20",
      ),
    ).toThrow("invalid interval assignment");
  });

  it("does not mutate the state", () => {
    const original = structuredClone(state);

    assertReviewEligible(state, "2026-10-20");

    expect(state).toEqual(original);
  });
});
