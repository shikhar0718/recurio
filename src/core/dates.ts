import type { LocalDate } from "./scheduling-types.js";

export type DateComparison = -1 | 0 | 1;

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function getDateParts(value: string): DateParts | null {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function isValidLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string") {
    return false;
  }

  const parts = getDateParts(value);
  if (parts === null) {
    return false;
  }

  return (
    parts.month >= 1 &&
    parts.month <= 12 &&
    parts.day >= 1 &&
    parts.day <= daysInMonth(parts.year, parts.month)
  );
}

export function parseLocalDate(value: unknown): LocalDate {
  if (!isValidLocalDate(value)) {
    throw new Error(`Invalid local calendar date: ${String(value)}`);
  }

  return value;
}

export function compareLocalDates(
  left: LocalDate,
  right: LocalDate,
): DateComparison {
  parseLocalDate(left);
  parseLocalDate(right);

  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

export function addCalendarDays(date: LocalDate, days: number): LocalDate {
  parseLocalDate(date);

  if (!Number.isInteger(days) || days < 0) {
    throw new Error(
      `Calendar-day offset must be a non-negative integer: ${days}`,
    );
  }

  const parts = getDateParts(date);
  if (parts === null) {
    throw new Error(`Invalid local calendar date: ${date}`);
  }

  let { year, month, day } = parts;
  let remainingDays = days;

  while (remainingDays > 0) {
    const remainingInMonth = daysInMonth(year, month) - day;

    if (remainingDays <= remainingInMonth) {
      day += remainingDays;
      remainingDays = 0;
      continue;
    }

    remainingDays -= remainingInMonth + 1;
    day = 1;

    if (month === 12) {
      year += 1;
      month = 1;
    } else {
      month += 1;
    }
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}
