import { describe, expect, it } from "vitest";

import { assertValidSchedulingState } from "../src/core/state-validation.js";
import type { SchedulingState } from "../src/core/scheduling-types.js";

const validState: SchedulingState = {
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

describe("scheduling state validation", () => {
  it("accepts a valid unmastered state", () => {
    expect(() => assertValidSchedulingState(validState)).not.toThrow();
  });

  it("rejects malformed persisted values", () => {
    expect(() =>
      assertValidSchedulingState({
        ...validState,
        reviewHistory: { ...validState.reviewHistory, hasEasyReview: "yes" },
      }),
    ).toThrow("Review history flags");
    expect(() =>
      assertValidSchedulingState({
        ...validState,
        nextDueDate: "2026-02-30",
      }),
    ).toThrow("invalid next due date");
  });

  it("requires a due date for unmastered topics", () => {
    expect(() =>
      assertValidSchedulingState({ ...validState, nextDueDate: null }),
    ).toThrow("Unmastered scheduling states must have a due date");
  });

  it("rejects a due date on mastered topics", () => {
    expect(() =>
      assertValidSchedulingState({ ...validState, isMastered: true }),
    ).toThrow("Mastered scheduling states cannot have a due date");
  });

  it("allows the mastered mode and last-assignment exception", () => {
    expect(() =>
      assertValidSchedulingState({
        ...validState,
        currentMode: "easy",
        isMastered: true,
        nextDueDate: null,
      }),
    ).not.toThrow();
  });
});
