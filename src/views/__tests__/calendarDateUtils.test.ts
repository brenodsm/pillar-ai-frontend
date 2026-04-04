import { describe, expect, it } from "vitest";
import {
  getDateKey,
  getMonthGrid,
  getMonthLabel,
  getWeekDays,
  getWeekLabel,
  isSameDay,
  shiftDateByMonths,
} from "../calendarDateUtils";

describe("calendarDateUtils", () => {
  it("builds week days from monday to sunday", () => {
    const week = getWeekDays(new Date(2026, 3, 3, 12, 0, 0));

    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(1);
    expect(week[0].getDate()).toBe(30);
    expect(week[0].getMonth()).toBe(2);
    expect(week[6].getDay()).toBe(0);
    expect(week[6].getDate()).toBe(5);
    expect(week[6].getMonth()).toBe(3);
  });

  it("formats week label when crossing months", () => {
    const week = getWeekDays(new Date(2026, 3, 3, 12, 0, 0));
    expect(getWeekLabel(week)).toBe("30 Mar – 5 Abr 2026");
  });

  it("builds a full month grid with leading and trailing days", () => {
    const monthGrid = getMonthGrid(new Date(2026, 3, 3, 12, 0, 0));

    expect(monthGrid).toHaveLength(5);
    expect(monthGrid[0]).toHaveLength(7);
    expect(monthGrid[4]).toHaveLength(7);
    expect(monthGrid[0][0].getDate()).toBe(30);
    expect(monthGrid[0][0].getMonth()).toBe(2);
    expect(monthGrid[4][6].getDate()).toBe(3);
    expect(monthGrid[4][6].getMonth()).toBe(4);
  });

  it("formats month labels and date keys in pt-BR style", () => {
    const date = new Date(2026, 3, 3, 12, 0, 0);

    expect(getMonthLabel(date)).toBe("Abr 2026");
    expect(getDateKey(date)).toBe("2026-04-03");
  });

  it("compares dates by day only", () => {
    const morning = new Date(2026, 3, 3, 8, 30, 0);
    const evening = new Date(2026, 3, 3, 21, 45, 0);

    expect(isSameDay(morning, evening)).toBe(true);
  });

  it("shifts month without skipping shorter months", () => {
    const shifted = shiftDateByMonths(new Date(2026, 0, 31, 10, 0, 0), 1);

    expect(shifted.getMonth()).toBe(1);
    expect(shifted.getDate()).toBe(28);
  });
});
