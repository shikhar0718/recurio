import { isValidLocalDate } from "./dates.js";
import { getReviewIntervals } from "./review-sequences.js";
import type { SchedulingMode, SchedulingState } from "./scheduling-types.js";

const MODES: readonly SchedulingMode[] = ["normal", "hard", "easy"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertMode(
  value: unknown,
  fieldName: string,
): asserts value is SchedulingMode {
  if (typeof value !== "string" || !MODES.includes(value as SchedulingMode)) {
    throw new Error(`${fieldName} must be one of: normal, hard, easy`);
  }
}

/**
 * Validate state at the persistence/application boundary.
 *
 * The domain functions use the compile-time SchedulingState type, but loaded
 * JSON can still contain malformed values. This assertion keeps those values
 * from reaching the scheduling transition functions.
 */
export function assertValidSchedulingState(
  value: unknown,
): asserts value is SchedulingState {
  if (!isRecord(value)) {
    throw new Error("Scheduling state must be an object");
  }

  assertMode(value.currentMode, "currentMode");

  if (!isRecord(value.lastAssignment)) {
    throw new Error("Scheduling state must contain an interval assignment");
  }

  assertMode(value.lastAssignment.mode, "lastAssignment.mode");
  const { mode, position, days } = value.lastAssignment;
  const intervals = getReviewIntervals(mode);

  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position >= intervals.length
  ) {
    throw new Error("Scheduling state contains an invalid interval position");
  }

  if (typeof days !== "number" || intervals[position] !== days) {
    throw new Error("Scheduling state contains an invalid interval assignment");
  }

  if (value.nextDueDate !== null && !isValidLocalDate(value.nextDueDate)) {
    throw new Error("Scheduling state contains an invalid next due date");
  }

  if (!isRecord(value.reviewHistory)) {
    throw new Error("Scheduling state must contain review history");
  }

  const { completedReviewCount, hasEasyReview, hasHardReview } =
    value.reviewHistory;
  if (
    typeof completedReviewCount !== "number" ||
    !Number.isInteger(completedReviewCount) ||
    completedReviewCount < 0
  ) {
    throw new Error("Review history count must be a non-negative integer");
  }

  if (
    typeof hasEasyReview !== "boolean" ||
    typeof hasHardReview !== "boolean"
  ) {
    throw new Error("Review history flags must be boolean values");
  }

  if (typeof value.isMastered !== "boolean") {
    throw new Error("Scheduling state mastery flag must be boolean");
  }

  if (value.isMastered && value.nextDueDate !== null) {
    throw new Error("Mastered scheduling states cannot have a due date");
  }

  if (!value.isMastered && value.nextDueDate === null) {
    throw new Error("Unmastered scheduling states must have a due date");
  }

  // Mastery is the one intentional exception: the rating that completed
  // mastery may have selected a new mode, while the last scheduled interval
  // remains the assignment that was actually reviewed.
  if (!value.isMastered && value.currentMode !== mode) {
    throw new Error(
      "Unmastered scheduling state has mismatched mode information",
    );
  }
}
