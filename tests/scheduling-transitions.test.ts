import { describe, expect, it } from "vitest";

import {
  advanceWithinSequence,
  transitionForRating,
  transitionSchedulingState,
  transitionToEasy,
  transitionToHard,
} from "../src/core/scheduling-transitions.js";
import { getReviewIntervals } from "../src/core/review-sequences.js";
import type {
  IntervalAssignment,
  SchedulingState,
} from "../src/core/scheduling-types.js";

function assignment(
  mode: IntervalAssignment["mode"],
  position: number,
): IntervalAssignment {
  const days = getReviewIntervals(mode)[position];
  if (days === undefined) {
    throw new Error(`Missing test interval for ${mode}:${position}`);
  }

  return { mode, position, days };
}

describe("scheduling transitions", () => {
  describe("forward progression", () => {
    it("advances to the next interval in the active sequence", () => {
      expect(advanceWithinSequence(assignment("normal", 1))).toEqual({
        mode: "normal",
        position: 2,
        days: 7,
      });
      expect(advanceWithinSequence(assignment("hard", 2))).toEqual({
        mode: "hard",
        position: 3,
        days: 10,
      });
    });

    it("keeps the terminal interval at the end of a sequence", () => {
      expect(advanceWithinSequence(assignment("normal", 3))).toEqual(
        assignment("normal", 3),
      );
      expect(advanceWithinSequence(assignment("hard", 4))).toEqual(
        assignment("hard", 4),
      );
      expect(advanceWithinSequence(assignment("easy", 2))).toEqual(
        assignment("easy", 2),
      );
    });
  });

  describe("Easy mode", () => {
    it("enters Easy at its first interval from another mode", () => {
      expect(transitionToEasy(assignment("normal", 2))).toEqual({
        mode: "easy",
        position: 0,
        days: 3,
      });
    });

    it("continues forward when Easy is already active", () => {
      expect(transitionToEasy(assignment("easy", 0))).toEqual({
        mode: "easy",
        position: 1,
        days: 7,
      });
    });

    it("cannot leave permanent Hard mode", () => {
      expect(transitionToEasy(assignment("hard", 2))).toEqual(
        assignment("hard", 3),
      );
    });
  });

  describe("Hard mode", () => {
    it("maps entry to the smallest Hard interval at or above the current interval", () => {
      expect(transitionToHard(assignment("normal", 0))).toEqual(
        assignment("hard", 0),
      );
      expect(transitionToHard(assignment("normal", 2))).toEqual(
        assignment("hard", 3),
      );
      expect(transitionToHard(assignment("easy", 2))).toEqual(
        assignment("hard", 4),
      );
    });

    it("permanently continues the Hard sequence after Hard entry", () => {
      expect(transitionToHard(assignment("hard", 2))).toEqual({
        mode: "hard",
        position: 3,
        days: 10,
      });
      expect(transitionForRating(assignment("hard", 3), "easy")).toEqual(
        assignment("hard", 4),
      );
    });
  });

  describe("unified rating transition", () => {
    it("dispatches Normal, Easy, and Hard ratings", () => {
      expect(transitionForRating(assignment("normal", 0), "normal")).toEqual(
        assignment("normal", 1),
      );
      expect(transitionForRating(assignment("easy", 0), "normal")).toEqual(
        assignment("easy", 1),
      );
      expect(transitionForRating(assignment("normal", 0), "easy")).toEqual(
        assignment("easy", 0),
      );
      expect(transitionForRating(assignment("normal", 0), "hard")).toEqual(
        assignment("hard", 0),
      );
    });

    it("updates only scheduling fields when given a full state", () => {
      const state: SchedulingState = {
        currentMode: "normal",
        lastAssignment: assignment("normal", 0),
        nextDueDate: "2026-10-20",
        reviewHistory: {
          completedReviewCount: 2,
          hasEasyReview: false,
          hasHardReview: false,
        },
        isMastered: false,
      };

      expect(transitionSchedulingState(state, "easy")).toEqual({
        ...state,
        currentMode: "easy",
        lastAssignment: assignment("easy", 0),
      });
    });
  });

  it("rejects positions outside the selected sequence", () => {
    expect(() =>
      advanceWithinSequence({ mode: "easy", position: 3, days: 15 }),
    ).toThrow("Sequence position");
  });

  it("rejects an assignment whose duration does not match its position", () => {
    expect(() =>
      transitionToHard({ mode: "normal", position: 0, days: 21 }),
    ).toThrow("invalid interval duration");
  });
});
