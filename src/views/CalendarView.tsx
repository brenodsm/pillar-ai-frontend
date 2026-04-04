import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { C } from "../constants/colors";
import { useAppServices } from "../services";
import type { CalendarMeeting } from "../types";
import {
  DAY_NAMES,
  getDateKey,
  getMonthGrid,
  getMonthLabel,
  getWeekDays,
  getWeekLabel,
  isCurrentMonth,
  isCurrentWeek,
  isSameDay,
  isSameMonth,
  shiftDateByDays,
  shiftDateByMonths,
  startOfDay,
} from "./calendarDateUtils";
import {
  getInitialCalendarViewMode,
  persistCalendarViewMode,
  type CalendarViewMode,
} from "./calendarViewModeStorage";

interface CalendarViewProps {
  userEmail: string;
  onSelectMeeting: (m: CalendarMeeting) => void;
}

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 19;
const HOUR_HEIGHT = 60;
const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;

function getMeetingPosition(meeting: CalendarMeeting) {
  const start = new Date(meeting.start);
  const end = new Date(meeting.end);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  const clampedStart = Math.max(startHour, GRID_START_HOUR);
  const clampedEnd = Math.min(endHour, GRID_END_HOUR);

  if (clampedStart >= clampedEnd) return null;

  const top = (clampedStart - GRID_START_HOUR) * HOUR_HEIGHT;
  const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 20);

  return { top, height };
}

function formatBlockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function computeColumnLayout(meetings: CalendarMeeting[]): Map<string, { colIndex: number; totalCols: number }> {
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const layout = new Map<string, { colIndex: number; totalCols: number }>();
  const groups: CalendarMeeting[][] = [];

  for (const meeting of sorted) {
    const meetingStart = new Date(meeting.start).getTime();
    let placed = false;

    for (const group of groups) {
      const maxEnd = Math.max(...group.map((g) => new Date(g.end).getTime()));
      if (meetingStart < maxEnd) {
        group.push(meeting);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([meeting]);
    }
  }

  for (const group of groups) {
    const totalCols = group.length;
    group.forEach((meeting, colIndex) => {
      layout.set(meeting.id, { colIndex, totalCols });
    });
  }

  return layout;
}

function sortMeetingsByStart(meetings: CalendarMeeting[]) {
  meetings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function CalendarView({ userEmail, onSelectMeeting }: CalendarViewProps) {
  const { users: usersService } = useAppServices();
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => getInitialCalendarViewMode());
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const monthGrid = useMemo(() => getMonthGrid(anchorDate), [anchorDate]);
  const monthDays = useMemo(() => monthGrid.flat(), [monthGrid]);
  const today = new Date();

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      void userEmail;
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const meetingsList = await usersService.getCalendarEvents(startDateTime, endDateTime);
      setMeetings(meetingsList);
    } catch {
      setError("Não foi possível carregar as reuniões.");
    } finally {
      setLoading(false);
    }
  }, [userEmail, usersService]);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    persistCalendarViewMode(viewMode);
  }, [viewMode]);

  const weekMeetingsByDay = useMemo(() => {
    const grouped: CalendarMeeting[][] = Array.from({ length: 7 }, () => []);

    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.start);

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        if (isSameDay(meetingDate, weekDays[dayIndex])) {
          grouped[dayIndex].push(meeting);
          break;
        }
      }
    }

    grouped.forEach(sortMeetingsByStart);
    return grouped;
  }, [meetings, weekDays]);

  const monthMeetingsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarMeeting[]>();

    for (const meeting of meetings) {
      const key = getDateKey(new Date(meeting.start));
      const dayMeetings = grouped.get(key);

      if (dayMeetings) {
        dayMeetings.push(meeting);
      } else {
        grouped.set(key, [meeting]);
      }
    }

    grouped.forEach(sortMeetingsByStart);
    return grouped;
  }, [meetings]);

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = nowHour >= GRID_START_HOUR && nowHour <= GRID_END_HOUR;
  const nowTop = (nowHour - GRID_START_HOUR) * HOUR_HEIGHT;
  const todayIndex = weekDays.findIndex((day) => isSameDay(day, today));

  const handleGoPrevious = () => {
    setAnchorDate((currentDate) =>
      viewMode === "week" ? shiftDateByDays(currentDate, -7) : shiftDateByMonths(currentDate, -1)
    );
  };

  const handleGoNext = () => {
    setAnchorDate((currentDate) =>
      viewMode === "week" ? shiftDateByDays(currentDate, 7) : shiftDateByMonths(currentDate, 1)
    );
  };

  const handleGoToday = () => {
    setAnchorDate(startOfDay(new Date()));
  };

  const handleSwitchToWeek = () => {
    setViewMode("week");
    setAnchorDate(startOfDay(new Date()));
  };

  const handleSwitchToMonth = () => {
    setViewMode("month");
    setAnchorDate(startOfDay(new Date()));
  };

  const isCurrentPeriod = viewMode === "week"
    ? isCurrentWeek(anchorDate, today)
    : isCurrentMonth(anchorDate, today);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 16,
        flexWrap: "wrap",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleGoPrevious}
            aria-label="Período anterior"
            style={{
              background: "none",
              border: `1px solid ${C.creamDark}`,
              borderRadius: 8,
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon name="chevronLeft" size={16} color={C.gray} />
          </button>
          <button
            onClick={handleGoNext}
            aria-label="Próximo período"
            style={{
              background: "none",
              border: `1px solid ${C.creamDark}`,
              borderRadius: 8,
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon name="chevron" size={16} color={C.gray} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, letterSpacing: "-0.02em", marginLeft: 8 }}>
            {viewMode === "week" ? getWeekLabel(weekDays) : getMonthLabel(anchorDate)}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "inline-flex",
            border: `1px solid ${C.creamDark}`,
            borderRadius: 10,
            padding: 2,
            background: C.white,
          }}>
            <button
              type="button"
              onClick={handleSwitchToWeek}
              aria-pressed={viewMode === "week"}
              style={{
                border: "none",
                background: viewMode === "week" ? "rgba(255,145,20,0.14)" : "transparent",
                color: viewMode === "week" ? C.orange : C.gray,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Semana atual
            </button>
            <button
              type="button"
              onClick={handleSwitchToMonth}
              aria-pressed={viewMode === "month"}
              style={{
                border: "none",
                background: viewMode === "month" ? "rgba(255,145,20,0.14)" : "transparent",
                color: viewMode === "month" ? C.orange : C.gray,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Mês inteiro
            </button>
          </div>

          <button
            onClick={handleGoToday}
            style={{
              background: isCurrentPeriod ? C.orange : "none",
              color: isCurrentPeriod ? C.white : C.gray,
              border: isCurrentPeriod ? "none" : `1px solid ${C.creamDark}`,
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Hoje
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(224,64,64,0.07)",
          border: "1px solid rgba(224,64,64,0.2)",
          color: C.redStop,
          borderRadius: 10,
          padding: "14px 18px",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0,
        }}>
          <span>{error}</span>
          <button onClick={fetchMeetings} style={{
            background: C.redStop,
            color: C.white,
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}>Tentar novamente</button>
        </div>
      )}

      {loading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 32,
            height: 32,
            border: `3px solid ${C.creamDark}`,
            borderTopColor: C.orange,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {!loading && !error && viewMode === "week" && (
        <div style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${C.creamDark}`, background: C.white }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "60px repeat(7, 1fr)",
            borderBottom: `1px solid ${C.creamDark}`,
            position: "sticky",
            top: 0,
            background: C.white,
            zIndex: 10,
          }}>
            <div style={{ padding: "12px 0" }} />
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={index}
                  style={{
                    textAlign: "center",
                    padding: "12px 4px",
                    borderLeft: `1px solid ${C.creamDark}`,
                  }}
                >
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.grayLight,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    {DAY_NAMES[day.getDay()]}
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginTop: 2,
                    color: isToday ? C.white : C.dark,
                    background: isToday ? C.orange : "transparent",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", position: "relative" }}>
            <div>
              {Array.from({ length: TOTAL_HOURS }, (_, hourIndex) => (
                <div key={hourIndex} style={{
                  height: HOUR_HEIGHT,
                  borderBottom: `1px solid ${C.creamDark}`,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: 4,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: C.grayLight }}>
                    {String(GRID_START_HOUR + hourIndex).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIndex) => {
              const isToday = isSameDay(day, today);
              const dayMeetings = weekMeetingsByDay[dayIndex];
              const colLayout = computeColumnLayout(dayMeetings);

              return (
                <div
                  key={dayIndex}
                  style={{
                    position: "relative",
                    borderLeft: `1px solid ${C.creamDark}`,
                    background: isToday ? "rgba(255,145,20,0.03)" : "transparent",
                  }}
                >
                  {Array.from({ length: TOTAL_HOURS }, (_, hourIndex) => (
                    <div key={hourIndex} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${C.creamDark}` }} />
                  ))}

                  {dayMeetings.map((meeting) => {
                    const position = getMeetingPosition(meeting);
                    if (!position) return null;

                    const { colIndex, totalCols } = colLayout.get(meeting.id) ?? { colIndex: 0, totalCols: 1 };
                    const leftPct = (colIndex / totalCols) * 100;
                    const widthPct = 100 / totalCols;

                    return (
                      <div
                        key={meeting.id}
                        className="calendar-meeting-block"
                        onClick={() => onSelectMeeting(meeting)}
                        style={{
                          top: position.top,
                          height: position.height,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {meeting.subject}
                        </div>
                        {position.height > 36 && (
                          <div style={{ fontSize: 11, color: C.grayLight, marginTop: 1 }}>
                            {formatBlockTime(meeting.start)} – {formatBlockTime(meeting.end)}
                          </div>
                        )}
                        {position.height > 54 && meeting.location && (
                          <div style={{ fontSize: 11, color: C.grayLighter, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {meeting.location}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {showNowLine && dayIndex === todayIndex && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: nowTop,
                      height: 2,
                      background: C.orange,
                      zIndex: 5,
                    }}>
                      <div style={{
                        position: "absolute",
                        left: -4,
                        top: -3,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: C.orange,
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && viewMode === "month" && (
        <div style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${C.creamDark}`, background: C.white }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
            borderBottom: `1px solid ${C.creamDark}`,
            position: "sticky",
            top: 0,
            background: C.white,
            zIndex: 10,
          }}>
            {DAY_NAMES.map((dayName) => (
              <div
                key={dayName}
                style={{
                  textAlign: "center",
                  padding: "12px 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.grayLight,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  borderRight: dayName === DAY_NAMES[DAY_NAMES.length - 1] ? "none" : `1px solid ${C.creamDark}`,
                }}
              >
                {dayName}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(130px, 1fr))" }}>
            {monthDays.map((day, index) => {
              const dayKey = getDateKey(day);
              const isCurrentMonthDay = isSameMonth(day, anchorDate);
              const isToday = isSameDay(day, today);
              const dayMeetings = monthMeetingsByDay.get(dayKey) ?? [];
              const rowIndex = Math.floor(index / 7);
              const lastRow = rowIndex === monthGrid.length - 1;
              const lastColumn = (index + 1) % 7 === 0;

              return (
                <div
                  key={dayKey}
                  style={{
                    minHeight: 136,
                    padding: "8px 8px 10px",
                    borderRight: lastColumn ? "none" : `1px solid ${C.creamDark}`,
                    borderBottom: lastRow ? "none" : `1px solid ${C.creamDark}`,
                    background: isToday ? "rgba(255,145,20,0.04)" : "transparent",
                    opacity: isCurrentMonthDay ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isToday ? C.orange : "transparent",
                      color: isToday ? C.white : C.dark,
                      fontSize: 14,
                      fontWeight: 700,
                    }}>
                      {day.getDate()}
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayMeetings.slice(0, 3).map((meeting) => (
                      <button
                        key={meeting.id}
                        type="button"
                        onClick={() => onSelectMeeting(meeting)}
                        style={{
                          width: "100%",
                          border: "1px solid rgba(255,145,20,0.18)",
                          borderLeft: `3px solid ${C.orange}`,
                          borderRadius: 6,
                          background: "rgba(255,145,20,0.1)",
                          color: C.dark,
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: "left",
                          padding: "4px 6px",
                          cursor: "pointer",
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: C.grayLight }}>{formatBlockTime(meeting.start)}</span> {meeting.subject}
                      </button>
                    ))}

                    {dayMeetings.length > 3 && (
                      <span style={{ fontSize: 11, color: C.grayLight, fontWeight: 600 }}>
                        +{dayMeetings.length - 3} reuniões
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && meetings.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            margin: "0 auto 16px",
            background: "rgba(255,145,20,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon name="calendar" size={24} color={C.grayLighter} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 6 }}>
            Nenhuma reunião encontrada
          </p>
          <p style={{ fontSize: 13, color: C.grayLight }}>
            Seu calendário está livre para os próximos 30 dias.
          </p>
        </div>
      )}
    </div>
  );
}
