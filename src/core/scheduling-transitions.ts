import { getReviewIntervals } from "./review-sequences.js";
import type {
  IntervalAssignment,
  ReviewRating,
  SchedulingMode,
  SchedulingState,
} from "./scheduling-types.js";

function validatePosition(mode: SchedulingMode, position: number): void {
  const intervals = getReviewIntervals(mode);

  if (
    !Number.isInteger(position) ||
    position < 0 ||
    position >= intervals.length
  ) {
    throw new Error(
      `Sequence position must be an integer from 0 through ${intervals.length - 1} for ${mode} mode: ${position}`,
    );
  }
}

function assignmentFor(
  mode: SchedulingMode,
  position: number,
): IntervalAssignment {
  validatePosition(mode, position);

  const days = getReviewIntervals(mode)[position];
  if (days === undefined) {
    throw new Error(
      `No interval exists at ${mode} sequence position ${position}`,
    );
  }

  return { mode, position, days };
}

function validateAssignment(assignment: IntervalAssignment): void {
  validatePosition(assignment.mode, assignment.position);

  if (
    getReviewIntervals(assignment.mode)[assignment.position] !== assignment.days
  ) {
    throw new Error("Scheduling assignment has an invalid interval duration");
  }
}

/**
 * Move one step forward in a mode's fixed sequence.
 *
 * The terminal interval is deliberately sticky: a topic can keep being
 * reviewed after reaching the end of a sequence without wrapping around.
 */
export function advanceWithinSequence(
  assignment: IntervalAssignment,
): IntervalAssignment {
  const intervals = getReviewIntervals(assignment.mode);
  validateAssignment(assignment);

  return assignmentFor(
    assignment.mode,
    Math.min(assignment.position + 1, intervals.length - 1),
  );
}

/** Start Easy mode, or advance it when it is already active. */
export function transitionToEasy(
  assignment: IntervalAssignment,
): IntervalAssignment {
  validateAssignment(assignment);

  if (assignment.mode === "hard" || assignment.mode === "easy") {
    return advanceWithinSequence(assignment);
  }

  return assignmentFor("easy", 0);
}

function hardPositionFor(assignment: IntervalAssignment): number {
  const hardIntervals = getReviewIntervals("hard");
  const currentIntervals = getReviewIntervals(assignment.mode);
  const currentDays = currentIntervals[assignment.position];

  if (currentDays === undefined) {
    throw new Error(
      `No interval exists at ${assignment.mode} sequence position ${assignment.position}`,
    );
  }

  // Choose the smallest Hard interval that is at least as long as the
  // current assigned interval.
  for (let index = 0; index < hardIntervals.length; index += 1) {
    const hardDays = hardIntervals[index];
    if (hardDays !== undefined && hardDays >= currentDays) {
      return index;
    }
  }

  throw new Error(
    `No Hard interval is greater than or equal to the current interval: ${currentDays} days`,
  );
}

/** Enter Hard mode using the current assignment's interval as the mapping key. */
export function transitionToHard(
  assignment: IntervalAssignment,
): IntervalAssignment {
  validateAssignment(assignment);

  if (assignment.mode === "hard") {
    return advanceWithinSequence(assignment);
  }

  return assignmentFor("hard", hardPositionFor(assignment));
}

/** Apply one review rating to an assignment's scheduling mode. */
export function transitionForRating(
  assignment: IntervalAssignment,
  rating: ReviewRating,
): IntervalAssignment;
export function transitionForRating(
  state: SchedulingState,
  rating: ReviewRating,
): SchedulingState;
export function transitionForRating(
  input: IntervalAssignment | SchedulingState,
  rating: ReviewRating,
): IntervalAssignment | SchedulingState {
  if ("lastAssignment" in input) {
    const lastAssignment = transitionForRating(input.lastAssignment, rating);

    return {
      ...input,
      currentMode: lastAssignment.mode,
      lastAssignment,
    };
  }

  validateAssignment(input);

  // Hard is a permanent mode: after entry, all ratings advance the Hard
  // sequence and cannot move the topic back to Normal or Easy.
  if (input.mode === "hard") {
    return advanceWithinSequence(input);
  }

  switch (rating) {
    case "normal":
      return advanceWithinSequence(input);
    case "easy":
      return transitionToEasy(input);
    case "hard":
      return transitionToHard(input);
  }
}

/**
 * Apply a rating to the scheduling portion of a state.
 *
 * Review history, mastery, and due dates are intentionally preserved here;
 * those concerns are updated by their own domain functions.
 */
export function transitionSchedulingState(
  state: SchedulingState,
  rating: ReviewRating,
): SchedulingState {
  return transitionForRating(state, rating);
}
