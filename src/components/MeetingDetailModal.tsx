import { C } from "../constants/colors";
import { Icon } from "./Icon";
import type { CalendarMeeting } from "../types";

interface MeetingDetailModalProps {
  meeting: CalendarMeeting;
  onClose: () => void;
  onStartMeeting: (meeting: CalendarMeeting) => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" });
  const day = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return { weekday, day, time };
};

export function MeetingDetailModal({ meeting, onClose, onStartMeeting }: MeetingDetailModalProps) {
  const start = formatDateTime(meeting.start);
  const end = formatDateTime(meeting.end);

  return (
    <div className="calendar-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, letterSpacing: "-0.02em", lineHeight: 1.3, flex: 1, marginRight: 16 }}>
            {meeting.subject}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}
          >
            <Icon name="x" size={20} color={C.grayLight} />
          </button>
        </div>

        <div style={{ height: 1, background: C.creamDark, marginBottom: 20 }} />

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Time */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,145,20,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="clock" size={18} color={C.orange} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Horário</div>
              <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>
                {start.weekday}, {start.day} · {start.time} – {end.time}
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,145,20,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="location" size={18} color={C.orange} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Local</div>
              <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>
                {meeting.location || "Sem local definido"}
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,145,20,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="users" size={18} color={C.orange} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Organizador</div>
              <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{meeting.organizer.name}</div>
            </div>
          </div>

          {/* Attendees */}
          {meeting.attendees.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,145,20,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Icon name="users" size={18} color={C.orange} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Participantes</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {meeting.attendees.map((a, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12, fontWeight: 500, color: C.gray,
                        background: C.bg, border: `1px solid ${C.creamDark}`,
                        borderRadius: 6, padding: "4px 10px",
                      }}
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: C.creamDark, margin: "24px 0 20px" }} />

        {/* Action button */}
        <button
          onClick={() => onStartMeeting(meeting)}
          className="btn-primary"
          style={{
            width: "100%", background: C.orange, color: C.white,
            justifyContent: "center", fontSize: 14.5, padding: "14px 24px",
          }}
        >
          <Icon name="mic" size={18} color={C.white} />
          Iniciar Reunião
        </button>
      </div>
    </div>
  );
}
