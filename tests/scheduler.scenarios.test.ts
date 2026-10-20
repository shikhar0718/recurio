import { describe, expect, it } from "vitest";

import { calculateReviewResult } from "../src/core/scheduler.js";
import type {
  ReviewRating,
  SchedulingState,
} from "../src/core/scheduling-types.js";

function createState(): SchedulingState {
  return {
    currentMode: "normal",
    lastAssignment: { mode: "normal", position: 0, days: 1 },
    nextDueDate: "2026-10-21",
    reviewHistory: {
      completedReviewCount: 0,
      hasEasyReview: false,
      hasHardReview: false,
    },
    isMastered: false,
  };
}

function review(
  state: SchedulingState,
  date: string,
  rating?: ReviewRating,
): SchedulingState {
  return calculateReviewResult(state, date, rating).nextState;
}

describe("scheduler user scenarios", () => {
  it("completes a Normal-only path and masters on review four", () => {
    let state = createState();

    state = review(state, "2026-10-21");
    expect(state.nextDueDate).toBe("2026-10-24");
    state = review(state, "2026-10-24");
    expect(state.nextDueDate).toBe("2026-10-31");
    state = review(state, "2026-10-31");
    expect(state.nextDueDate).toBe("2026-11-15");
    state = review(state, "2026-11-15");

    expect(state.isMastered).toBe(true);
    expect(state.nextDueDate).toBeNull();
    expect(state.reviewHistory.completedReviewCount).toBe(4);
    expect(state.lastAssignment).toEqual({
      mode: "normal",
      position: 3,
      days: 15,
    });
  });

  it("enters Easy, continues Easy, and masters on review three", () => {
    let state = createState();

    state = review(state, "2026-10-21", "easy");
    expect(state.currentMode).toBe("easy");
    expect(state.nextDueDate).toBe("2026-10-24");
    state = review(state, "2026-10-24", "easy");
    expect(state.lastAssignment).toEqual({
      mode: "easy",
      position: 1,
      days: 7,
    });
    expect(state.nextDueDate).toBe("2026-10-31");
    state = review(state, "2026-10-31", "normal");

    expect(state.isMastered).toBe(true);
    expect(state.nextDueDate).toBeNull();
    expect(state.reviewHistory.completedReviewCount).toBe(3);
    expect(state.lastAssignment).toEqual({
      mode: "easy",
      position: 1,
      days: 7,
    });
  });

  it("enters Hard and never leaves it", () => {
    let state = createState();

    state = review(state, "2026-10-21", "hard");
    expect(state.currentMode).toBe("hard");
    expect(state.lastAssignment).toEqual({
      mode: "hard",
      position: 0,
      days: 1,
    });
    state = review(state, "2026-10-22", "normal");
    expect(state.lastAssignment).toEqual({
      mode: "hard",
      position: 1,
      days: 3,
    });
    state = review(state, "2026-10-25", "easy");
    expect(state.currentMode).toBe("hard");
    expect(state.lastAssignment).toEqual({
      mode: "hard",
      position: 2,
      days: 5,
    });
  });

  it("uses the actual late review date for the next due date", () => {
    const state = review(createState(), "2026-11-01");

    expect(state.nextDueDate).toBe("2026-11-04");
  });

  it("does not mutate state while calculating a review", () => {
    const original = createState();

    calculateReviewResult(original, "2026-10-21", "normal");

    expect(original).toEqual(createState());
  });

  it("rejects early and mastered reviews", () => {
    expect(() => calculateReviewResult(createState(), "2026-10-20")).toThrow(
      "Review is early",
    );

    const mastered: SchedulingState = {
      ...createState(),
      isMastered: true,
      nextDueDate: null,
    };
    expect(() => calculateReviewResult(mastered, "2026-10-21")).toThrow(
      "Mastered topics",
    );
  });

  it("preserves the previous assignment when a mode change causes mastery", () => {
    const state: SchedulingState = {
      ...createState(),
      lastAssignment: { mode: "normal", position: 2, days: 7 },
      nextDueDate: "2026-10-21",
      reviewHistory: {
        completedReviewCount: 2,
        hasEasyReview: false,
        hasHardReview: false,
      },
    };

    const result = calculateReviewResult(state, "2026-10-21", "easy");

    expect(result.nextState.currentMode).toBe("easy");
    expect(result.nextState.lastAssignment).toEqual({
      mode: "normal",
      position: 2,
      days: 7,
    });
    expect(result.nextState.nextDueDate).toBeNull();
    expect(result.previousAssignment).toEqual(state.lastAssignment);
    expect(result.nextAssignment).toBeNull();
  });
});
