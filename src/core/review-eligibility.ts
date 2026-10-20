import { compareLocalDates, parseLocalDate } from "./dates.js";
import { assertValidSchedulingState } from "./state-validation.js";
import type { LocalDate, SchedulingState } from "./scheduling-types.js";

export function assertReviewEligible(
  state: SchedulingState,
  reviewDate: LocalDate,
): void {
  parseLocalDate(reviewDate);
  assertValidSchedulingState(state);

  if (state.isMastered) {
    throw new Error("Mastered topics do not have scheduled reviews");
  }

  if (state.nextDueDate === null) {
    throw new Error("Unmastered topics must have scheduled reviews");
  }

  parseLocalDate(state.nextDueDate);

  if (compareLocalDates(reviewDate, state.nextDueDate) < 0) {
    throw new Error(
      `Review is early: topic is not due until ${state.nextDueDate}`,
    );
  }
}
