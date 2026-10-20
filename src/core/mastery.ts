import type {
  MasteryThreshold,
  ReviewHistory,
  ReviewRating,
} from "./scheduling-types.js";

export type MasteryOutcome = {
  reviewHistory: ReviewHistory;
  masteryThreshold: MasteryThreshold;
  isMastered: boolean;
};

function validateReviewCount(reviewCount: number): void {
  if (!Number.isInteger(reviewCount) || reviewCount < 0) {
    throw new Error(
      `Completed review count must be a non-negative integer: ${reviewCount}`,
    );
  }
}

export function calculateMasteryOutcome(
  previousHistory: ReviewHistory,
  currentRating: ReviewRating,
): MasteryOutcome {
  validateReviewCount(previousHistory.completedReviewCount);

  const reviewHistory: ReviewHistory = {
    completedReviewCount: previousHistory.completedReviewCount + 1,
    hasEasyReview: previousHistory.hasEasyReview || currentRating === "easy",
    hasHardReview: previousHistory.hasHardReview || currentRating === "hard",
  };

  const masteryThreshold: MasteryThreshold = reviewHistory.hasHardReview
    ? 5
    : reviewHistory.hasEasyReview
      ? 3
      : 4;

  return {
    reviewHistory,
    masteryThreshold,
    isMastered: reviewHistory.completedReviewCount >= masteryThreshold,
  };
}
