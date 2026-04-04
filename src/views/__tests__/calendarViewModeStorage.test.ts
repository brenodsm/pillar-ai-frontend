import { describe, expect, it, vi } from "vitest";
import {
  getInitialCalendarViewMode,
  persistCalendarViewMode,
  type CalendarViewMode,
} from "../calendarViewModeStorage";

function createStorageMock(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}

describe("calendarViewModeStorage", () => {
  it("defaults to week when there is no persisted value", () => {
    const storage = createStorageMock(null);

    expect(getInitialCalendarViewMode(storage)).toBe("week");
  });

  it("returns month when persisted value is month", () => {
    const storage = createStorageMock("month");

    expect(getInitialCalendarViewMode(storage)).toBe("month");
  });

  it("persists the selected mode", () => {
    const storage = createStorageMock(null);
    const mode: CalendarViewMode = "month";

    persistCalendarViewMode(mode, storage);

    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});
