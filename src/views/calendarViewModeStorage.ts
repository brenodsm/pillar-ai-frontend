export type CalendarViewMode = "week" | "month";

const CALENDAR_VIEW_MODE_STORAGE_KEY = "pillar.calendar.viewMode";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getInitialCalendarViewMode(storage?: ReadableStorage | null): CalendarViewMode {
  const targetStorage = storage ?? getBrowserStorage();

  try {
    const savedMode = targetStorage?.getItem(CALENDAR_VIEW_MODE_STORAGE_KEY);
    return savedMode === "month" ? "month" : "week";
  } catch {
    return "week";
  }
}

export function persistCalendarViewMode(
  mode: CalendarViewMode,
  storage?: WritableStorage | null
): void {
  const targetStorage = storage ?? getBrowserStorage();

  try {
    targetStorage?.setItem(CALENDAR_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage write failures.
  }
}
