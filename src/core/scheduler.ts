import { addCalendarDays } from "./dates.js";
import { calculateMasteryOutcome } from "./mastery.js";
import { assertReviewEligible } from "./review-eligibility.js";
import { transitionForRating } from "./scheduling-transitions.js";
import type {
  IntervalAssignment,
  LocalDate,
  MasteryThreshold,
  ReviewRating,
  SchedulingState,
} from "./scheduling-types.js";

export type ReviewResult = {
  rating: ReviewRating;
  reviewDate: LocalDate;
  previousState: SchedulingState;
  nextState: SchedulingState;
  masteryThreshold: MasteryThreshold;
  enteredHardMode: boolean;
  previousAssignment: IntervalAssignment;
  nextAssignment: IntervalAssignment | null;
};

export function calculateReviewResult(
  state: SchedulingState,
  reviewDate: LocalDate,
  rating: ReviewRating = "normal",
): ReviewResult {
  assertReviewEligible(state, reviewDate);

  const previousState: SchedulingState = {
    ...state,
    lastAssignment: { ...state.lastAssignment },
    reviewHistory: { ...state.reviewHistory },
  };
  const mastery = calculateMasteryOutcome(state.reviewHistory, rating);
  const candidateState = transitionForRating(state, rating);
  const enteredHardMode =
    state.currentMode !== "hard" && candidateState.currentMode === "hard";
  const mastered = mastery.isMastered;

  const nextState: SchedulingState = mastered
    ? {
        ...candidateState,
        nextDueDate: null,
        reviewHistory: mastery.reviewHistory,
        isMastered: true,
        lastAssignment: { ...state.lastAssignment },
      }
    : {
        ...candidateState,
        nextDueDate: addCalendarDays(
          reviewDate,
          candidateState.lastAssignment.days,
        ),
        reviewHistory: mastery.reviewHistory,
        isMastered: false,
      };

  return {
    rating,
    reviewDate,
    previousState,
    nextState,
    masteryThreshold: mastery.masteryThreshold,
    enteredHardMode,
    previousAssignment: { ...state.lastAssignment },
    nextAssignment: mastered ? null : { ...candidateState.lastAssignment },
  };
}
