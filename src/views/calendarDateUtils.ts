export const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export function getStartOfWeek(date: Date): Date {
  const base = startOfDay(date);
  const dayOfWeek = base.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  base.setDate(base.getDate() - mondayOffset);
  return base;
}

export function getWeekDays(referenceDate: Date): Date[] {
  const monday = getStartOfWeek(referenceDate);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

export function getMonthGrid(referenceDate: Date): Date[][] {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  monthEnd.setHours(0, 0, 0, 0);

  const gridStart = getStartOfWeek(monthStart);
  const gridEnd = getStartOfWeek(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + 6);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);

  while (cursor.getTime() <= gridEnd.getTime()) {
    const week = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + index);
      return day;
    });
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

export function getWeekLabel(days: Date[]): string {
  const first = days[0];
  const last = days[6];

  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
  }

  return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
}

export function getMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftDateByDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function shiftDateByMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const baseDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const daysInTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(baseDay, daysInTargetMonth));
  return startOfDay(next);
}

export function isCurrentWeek(referenceDate: Date, now = new Date()): boolean {
  return isSameDay(getStartOfWeek(referenceDate), getStartOfWeek(now));
}

export function isCurrentMonth(referenceDate: Date, now = new Date()): boolean {
  return referenceDate.getMonth() === now.getMonth() && referenceDate.getFullYear() === now.getFullYear();
}
