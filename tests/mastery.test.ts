import { describe, expect, it } from "vitest";

import {
  calculateMasteryOutcome,
  type MasteryOutcome,
} from "../src/core/mastery.js";
import type {
  ReviewHistory,
  ReviewRating,
} from "../src/core/scheduling-types.js";

const emptyHistory: ReviewHistory = {
  completedReviewCount: 0,
  hasEasyReview: false,
  hasHardReview: false,
};

function applyRatings(ratings: ReviewRating[]): MasteryOutcome {
  let history = emptyHistory;
  let outcome: MasteryOutcome = {
    reviewHistory: emptyHistory,
    masteryThreshold: 4,
    isMastered: false,
  };

  for (const rating of ratings) {
    outcome = calculateMasteryOutcome(history, rating);
    history = outcome.reviewHistory;
  }

  return outcome;
}

describe("mastery outcomes", () => {
  it("keeps Normal-only topics at a threshold of four", () => {
    const outcome = applyRatings(["normal", "normal", "normal"]);

    expect(outcome.masteryThreshold).toBe(4);
    expect(outcome.reviewHistory.completedReviewCount).toBe(3);
    expect(outcome.isMastered).toBe(false);
  });

  it("masters a Normal-only topic on its fourth review", () => {
    const outcome = applyRatings(["normal", "normal", "normal", "normal"]);

    expect(outcome.masteryThreshold).toBe(4);
    expect(outcome.reviewHistory.completedReviewCount).toBe(4);
    expect(outcome.isMastered).toBe(true);
  });

  it("masters a topic after three reviews when Easy occurred without Hard", () => {
    const outcome = applyRatings(["easy", "normal", "easy"]);

    expect(outcome.masteryThreshold).toBe(3);
    expect(outcome.reviewHistory).toEqual({
      completedReviewCount: 3,
      hasEasyReview: true,
      hasHardReview: false,
    });
    expect(outcome.isMastered).toBe(true);
  });

  it("raises the threshold to five when Hard occurs", () => {
    const outcome = applyRatings(["normal", "normal", "hard"]);

    expect(outcome.masteryThreshold).toBe(5);
    expect(outcome.reviewHistory.completedReviewCount).toBe(3);
    expect(outcome.isMastered).toBe(false);
  });

  it("masters a Hard-history topic on its fifth review", () => {
    const outcome = applyRatings(["hard", "normal", "easy", "normal", "hard"]);

    expect(outcome.masteryThreshold).toBe(5);
    expect(outcome.reviewHistory.completedReviewCount).toBe(5);
    expect(outcome.isMastered).toBe(true);
  });

  it("does not lower the threshold after Easy follows Hard", () => {
    const outcome = applyRatings(["hard", "easy", "easy"]);

    expect(outcome.masteryThreshold).toBe(5);
    expect(outcome.reviewHistory.hasHardReview).toBe(true);
    expect(outcome.isMastered).toBe(false);
  });

  it("counts the current review before evaluating mastery", () => {
    const previousHistory: ReviewHistory = {
      completedReviewCount: 2,
      hasEasyReview: true,
      hasHardReview: false,
    };

    const outcome = calculateMasteryOutcome(previousHistory, "normal");

    expect(outcome.reviewHistory.completedReviewCount).toBe(3);
    expect(outcome.masteryThreshold).toBe(3);
    expect(outcome.isMastered).toBe(true);
  });

  it("does not mutate the previous history", () => {
    const previousHistory: ReviewHistory = {
      completedReviewCount: 2,
      hasEasyReview: false,
      hasHardReview: false,
    };

    calculateMasteryOutcome(previousHistory, "easy");

    expect(previousHistory).toEqual({
      completedReviewCount: 2,
      hasEasyReview: false,
      hasHardReview: false,
    });
  });

  it("rejects an invalid previous review count", () => {
    expect(() =>
      calculateMasteryOutcome(
        { ...emptyHistory, completedReviewCount: -1 },
        "normal",
      ),
    ).toThrow();

    expect(() =>
      calculateMasteryOutcome(
        { ...emptyHistory, completedReviewCount: 1.5 },
        "normal",
      ),
    ).toThrow();
  });
});
