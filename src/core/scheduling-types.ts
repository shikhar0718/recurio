export type SchedulingMode = "normal" | "hard" | "easy";

export type ReviewRating = "normal" | "hard" | "easy";

/** A calendar date in canonical YYYY-MM-DD form. */
export type LocalDate = string;

export type MasteryThreshold = 3 | 4 | 5;

export type ReviewHistory = {
  completedReviewCount: number;
  hasEasyReview: boolean;
  hasHardReview: boolean;
};

export type IntervalAssignment = {
  mode: SchedulingMode;
  position: number;
  days: number;
};

export type SchedulingState = {
  currentMode: SchedulingMode;
  lastAssignment: IntervalAssignment;
  nextDueDate: LocalDate | null;
  reviewHistory: ReviewHistory;
  isMastered: boolean;
};
