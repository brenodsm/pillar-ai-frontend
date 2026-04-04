import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "../constants/colors";
import { Icon } from "../components/Icon";
import { useAppServices } from "../services";
import type { CalendarMeeting } from "../types";

interface CalendarViewProps {
  userEmail: string;
  onSelectMeeting: (m: CalendarMeeting) => void;
}

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 19;
const HOUR_HEIGHT = 60;
const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function getWeekLabel(days: Date[]): string {
  const first = days[0];
  const last = days[6];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
}

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
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function computeColumnLayout(
  meetings: CalendarMeeting[]
): Map<string, { colIndex: number; totalCols: number }> {
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const layout = new Map<string, { colIndex: number; totalCols: number }>();
  const groups: CalendarMeeting[][] = [];

  for (const m of sorted) {
    const mStart = new Date(m.start).getTime();
    let placed = false;
    for (const group of groups) {
      const maxEnd = Math.max(...group.map((g) => new Date(g.end).getTime()));
      if (mStart < maxEnd) {
        group.push(m);
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push([m]);
    }
  }

  for (const group of groups) {
    const totalCols = group.length;
    group.forEach((m, colIndex) => {
      layout.set(m.id, { colIndex, totalCols });
    });
  }

  return layout;
}

export function CalendarView({ userEmail, onSelectMeeting }: CalendarViewProps) {
  const { users: usersService } = useAppServices();
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const today = useMemo(() => new Date(), []);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meetingsList = await usersService.getUserMeetings(userEmail);
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

  // Group meetings by day of the current week
  const meetingsByDay = useMemo(() => {
    const grouped: CalendarMeeting[][] = Array.from({ length: 7 }, () => []);
    for (const m of meetings) {
      const mDate = new Date(m.start);
      for (let i = 0; i < 7; i++) {
        if (isSameDay(mDate, weekDays[i])) {
          grouped[i].push(m);
          break;
        }
      }
    }
    return grouped;
  }, [meetings, weekDays]);

  // Current time indicator position
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = nowHour >= GRID_START_HOUR && nowHour <= GRID_END_HOUR;
  const nowTop = (nowHour - GRID_START_HOUR) * HOUR_HEIGHT;
  const todayIndex = weekDays.findIndex((d) => isSameDay(d, today));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Week navigation */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Semana anterior"
            style={{
              background: "none", border: `1px solid ${C.creamDark}`, borderRadius: 8,
              padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center",
            }}
          >
            <Icon name="chevronLeft" size={16} color={C.gray} />
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Próxima semana"
            style={{
              background: "none", border: `1px solid ${C.creamDark}`, borderRadius: 8,
              padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center",
            }}
          >
            <Icon name="chevron" size={16} color={C.gray} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, letterSpacing: "-0.02em", marginLeft: 8 }}>
            {getWeekLabel(weekDays)}
          </h2>
        </div>
        <button
          onClick={() => setWeekOffset(0)}
          style={{
            background: weekOffset === 0 ? C.orange : "none",
            color: weekOffset === 0 ? C.white : C.gray,
            border: weekOffset === 0 ? "none" : `1px solid ${C.creamDark}`,
            borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Hoje
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(224,64,64,0.07)", border: "1px solid rgba(224,64,64,0.2)",
          color: C.redStop, borderRadius: 10, padding: "14px 18px", fontSize: 13,
          fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexShrink: 0,
        }}>
          <span>{error}</span>
          <button onClick={fetchMeetings} style={{
            background: C.redStop, color: C.white, border: "none", borderRadius: 6,
            padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Tentar novamente</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 32, height: 32, border: `3px solid ${C.creamDark}`,
            borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* Calendar grid */}
      {!loading && !error && (
        <div style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${C.creamDark}`, background: C.white }}>
          {/* Day columns header */}
          <div style={{
            display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)",
            borderBottom: `1px solid ${C.creamDark}`, position: "sticky", top: 0,
            background: C.white, zIndex: 10,
          }}>
            <div style={{ padding: "12px 0" }} /> {/* empty corner */}
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={i}
                  style={{
                    textAlign: "center", padding: "12px 4px",
                    borderLeft: `1px solid ${C.creamDark}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {DAY_NAMES[day.getDay()]}
                  </div>
                  <div style={{
                    fontSize: 20, fontWeight: 700, marginTop: 2,
                    color: isToday ? C.white : C.dark,
                    background: isToday ? C.orange : "transparent",
                    width: 32, height: 32, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)",
            position: "relative",
          }}>
            {/* Time labels column */}
            <div>
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} style={{
                  height: HOUR_HEIGHT, borderBottom: `1px solid ${C.creamDark}`,
                  display: "flex", alignItems: "flex-start", justifyContent: "center",
                  paddingTop: 4,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: C.grayLight }}>
                    {String(GRID_START_HOUR + i).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const isToday = isSameDay(day, today);
              const dayMeetings = meetingsByDay[dayIndex];

              return (
                <div
                  key={dayIndex}
                  style={{
                    position: "relative",
                    borderLeft: `1px solid ${C.creamDark}`,
                    background: isToday ? "rgba(255,145,20,0.03)" : "transparent",
                  }}
                >
                  {/* Hour slot lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={i} style={{
                      height: HOUR_HEIGHT,
                      borderBottom: `1px solid ${C.creamDark}`,
                    }} />
                  ))}

                  {/* Meeting blocks */}
                  {(() => {
                    const colLayout = computeColumnLayout(dayMeetings);
                    return dayMeetings.map((m) => {
                      const pos = getMeetingPosition(m);
                      if (!pos) return null;
                      const { colIndex, totalCols } = colLayout.get(m.id) ?? { colIndex: 0, totalCols: 1 };
                      const leftPct = (colIndex / totalCols) * 100;
                      const widthPct = 100 / totalCols;
                      return (
                        <div
                          key={m.id}
                          className="calendar-meeting-block"
                          onClick={() => onSelectMeeting(m)}
                          style={{
                            top: pos.top,
                            height: pos.height,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.subject}
                          </div>
                          {pos.height > 36 && (
                            <div style={{ fontSize: 11, color: C.grayLight, marginTop: 1 }}>
                              {formatBlockTime(m.start)} – {formatBlockTime(m.end)}
                            </div>
                          )}
                          {pos.height > 54 && m.location && (
                            <div style={{ fontSize: 11, color: C.grayLighter, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {m.location}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {/* Now indicator */}
                  {showNowLine && dayIndex === todayIndex && (
                    <div style={{
                      position: "absolute", left: 0, right: 0, top: nowTop,
                      height: 2, background: C.orange, zIndex: 5,
                    }}>
                      <div style={{
                        position: "absolute", left: -4, top: -3,
                        width: 8, height: 8, borderRadius: "50%",
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

      {/* Empty state */}
      {!loading && !error && meetings.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
            background: "rgba(255,145,20,0.08)", display: "flex",
            alignItems: "center", justifyContent: "center",
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
