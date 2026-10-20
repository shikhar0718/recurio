import type { SchedulingMode } from "./scheduling-types.js";

export const NORMAL_INTERVALS = [1, 3, 7, 15] as const;
export const HARD_INTERVALS = [1, 3, 5, 10, 20] as const;
export const EASY_INTERVALS = [3, 7, 15] as const;

export const REVIEW_INTERVALS = {
  normal: NORMAL_INTERVALS,
  hard: HARD_INTERVALS,
  easy: EASY_INTERVALS,
} as const satisfies Record<SchedulingMode, readonly number[]>;

export function getReviewIntervals(mode: SchedulingMode): readonly number[] {
  return REVIEW_INTERVALS[mode];
}
