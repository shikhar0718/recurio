import { describe, expect, it } from "vitest";

import { calculateReviewResult } from "../src/core/scheduler.js";
import type { SchedulingState } from "../src/core/scheduling-types.js";

function state(
  mode: SchedulingState["currentMode"],
  position: number,
  reviewCount = 0,
  hasEasyReview = false,
  hasHardReview = false,
): SchedulingState {
  const days = {
    normal: [1, 3, 7, 15],
    hard: [1, 3, 5, 10, 20],
    easy: [3, 7, 15],
  }[mode][position];

  if (days === undefined) {
    throw new Error("Invalid test state");
  }

  return {
    currentMode: mode,
    lastAssignment: { mode, position, days },
    nextDueDate: "2026-10-20",
    reviewHistory: {
      completedReviewCount: reviewCount,
      hasEasyReview,
      hasHardReview,
    },
    isMastered: false,
  };
}

describe("complete pure review calculation", () => {
  it("advances Normal and schedules from the actual review date", () => {
    const result = calculateReviewResult(state("normal", 0), "2026-10-25");

    expect(result.nextState.lastAssignment).toEqual({
      mode: "normal",
      position: 1,
      days: 3,
    });
    expect(result.nextState.nextDueDate).toBe("2026-10-28");
    expect(result.nextState.reviewHistory.completedReviewCount).toBe(1);
  });

  it("enters Easy at three days", () => {
    const result = calculateReviewResult(
      state("normal", 2),
      "2026-10-20",
      "easy",
    );

    expect(result.nextState.currentMode).toBe("easy");
    expect(result.nextState.lastAssignment).toEqual({
      mode: "easy",
      position: 0,
      days: 3,
    });
    expect(result.nextState.nextDueDate).toBe("2026-10-23");
  });

  it("enters Hard using the approved upward mapping", () => {
    const result = calculateReviewResult(
      state("normal", 2),
      "2026-10-20",
      "hard",
    );

    expect(result.enteredHardMode).toBe(true);
    expect(result.nextState.lastAssignment).toEqual({
      mode: "hard",
      position: 3,
      days: 10,
    });
    expect(result.nextState.nextDueDate).toBe("2026-10-30");
    expect(result.nextState.reviewHistory.hasHardReview).toBe(true);
  });

  it("advances Hard regardless of the later rating", () => {
    const result = calculateReviewResult(
      state("hard", 1, 1, false, true),
      "2026-10-20",
      "easy",
    );

    expect(result.nextState.currentMode).toBe("hard");
    expect(result.nextState.lastAssignment).toEqual({
      mode: "hard",
      position: 2,
      days: 5,
    });
  });

  it("treats an omitted rating as Normal", () => {
    const result = calculateReviewResult(state("easy", 0), "2026-10-20");

    expect(result.rating).toBe("normal");
    expect(result.nextState.lastAssignment).toEqual({
      mode: "easy",
      position: 1,
      days: 7,
    });
  });

  it("stops scheduling when Normal-only mastery is reached", () => {
    const result = calculateReviewResult(
      state("normal", 2, 3),
      "2026-10-20",
      "normal",
    );

    expect(result.masteryThreshold).toBe(4);
    expect(result.nextState.isMastered).toBe(true);
    expect(result.nextState.nextDueDate).toBeNull();
    expect(result.nextState.lastAssignment).toEqual({
      mode: "normal",
      position: 2,
      days: 7,
    });
    expect(result.nextAssignment).toBeNull();
  });

  it("preserves the previous assignment when Easy causes mastery", () => {
    const result = calculateReviewResult(
      state("normal", 2, 2),
      "2026-10-20",
      "easy",
    );

    expect(result.nextState.currentMode).toBe("easy");
    expect(result.nextState.isMastered).toBe(true);
    expect(result.nextState.nextDueDate).toBeNull();
    expect(result.nextState.lastAssignment).toEqual({
      mode: "normal",
      position: 2,
      days: 7,
    });
  });

  it("rejects early reviews without producing a result", () => {
    expect(() =>
      calculateReviewResult(state("normal", 0), "2026-10-19"),
    ).toThrow("Review is early");
  });

  it("rejects scheduled reviews for mastered topics", () => {
    expect(() =>
      calculateReviewResult(
        { ...state("normal", 0), isMastered: true, nextDueDate: null },
        "2026-10-20",
      ),
    ).toThrow("Mastered topics");
  });
});
