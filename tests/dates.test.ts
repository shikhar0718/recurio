import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  compareLocalDates,
  isValidLocalDate,
  parseLocalDate,
} from "../src/core/dates.js";

describe("local calendar dates", () => {
  it("accepts canonical valid dates", () => {
    expect(isValidLocalDate("2026-10-20")).toBe(true);
    expect(isValidLocalDate("2024-02-29")).toBe(true);
  });

  it("rejects malformed dates", () => {
    expect(isValidLocalDate("26-10-20")).toBe(false);
    expect(isValidLocalDate("2026/10/20")).toBe(false);
    expect(isValidLocalDate("20261020")).toBe(false);
    expect(isValidLocalDate("2026-1-20")).toBe(false);
    expect(isValidLocalDate("2026-10-2")).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidLocalDate("2026-02-29")).toBe(false);
    expect(isValidLocalDate("2026-04-31")).toBe(false);
    expect(isValidLocalDate("2026-13-01")).toBe(false);
    expect(isValidLocalDate("2026-00-10")).toBe(false);
    expect(isValidLocalDate("2026-10-00")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidLocalDate(null)).toBe(false);
    expect(isValidLocalDate(undefined)).toBe(false);
    expect(isValidLocalDate(20261020)).toBe(false);
  });

  it("returns a valid date from parseLocalDate", () => {
    expect(parseLocalDate("2026-10-20")).toBe("2026-10-20");
  });

  it("throws a clear error for an invalid parsed date", () => {
    expect(() => parseLocalDate("2026-02-30")).toThrow(
      "Invalid local calendar date: 2026-02-30",
    );
  });

  it("compares dates chronologically", () => {
    expect(compareLocalDates("2026-10-19", "2026-10-20")).toBe(-1);
    expect(compareLocalDates("2026-10-20", "2026-10-20")).toBe(0);
    expect(compareLocalDates("2026-10-21", "2026-10-20")).toBe(1);
  });

  it("compares dates across month and year boundaries", () => {
    expect(compareLocalDates("2026-12-31", "2027-01-01")).toBe(-1);
    expect(compareLocalDates("2027-01-01", "2026-12-31")).toBe(1);
  });

  it("rejects invalid dates before comparing them", () => {
    expect(() => compareLocalDates("2026-02-30", "2026-03-01")).toThrow();
    expect(() => compareLocalDates("2026-03-01", "2026-02-30")).toThrow();
  });

  it("returns the same date when adding zero days", () => {
    expect(addCalendarDays("2026-10-20", 0)).toBe("2026-10-20");
  });

  it("adds days within a month", () => {
    expect(addCalendarDays("2026-10-20", 7)).toBe("2026-10-27");
  });

  it("crosses month boundaries", () => {
    expect(addCalendarDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addCalendarDays("2026-04-30", 1)).toBe("2026-05-01");
  });

  it("crosses year boundaries", () => {
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap-year February", () => {
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addCalendarDays("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("handles non-leap-year February", () => {
    expect(addCalendarDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("rejects invalid offsets", () => {
    expect(() => addCalendarDays("2026-10-20", -1)).toThrow();
    expect(() => addCalendarDays("2026-10-20", 1.5)).toThrow();
    expect(() => addCalendarDays("2026-10-20", Number.NaN)).toThrow();
    expect(() =>
      addCalendarDays("2026-10-20", Number.POSITIVE_INFINITY),
    ).toThrow();
  });

  it("rejects an invalid starting date", () => {
    expect(() => addCalendarDays("2026-02-30", 1)).toThrow(
      "Invalid local calendar date: 2026-02-30",
    );
  });
});
