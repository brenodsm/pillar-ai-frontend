import { useCallback, useEffect, useState } from "react";
import { C } from "../constants/colors";
import { Icon } from "../components/Icon";
import { useAppServices } from "../services";
import type { CalendarMeeting, SessionUser } from "../types";

interface CalendarMeetingsViewProps {
  user: SessionUser;
  onSelectMeeting: (m: CalendarMeeting) => void;
  onChangeEmail: () => void;
  onMeetingsLoaded: (meetings: CalendarMeeting[]) => void;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });

export function CalendarMeetingsView({
  user,
  onSelectMeeting,
  onChangeEmail,
  onMeetingsLoaded,
}: CalendarMeetingsViewProps) {
  const { users: usersService } = useAppServices();
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      void user.email;
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const list = await usersService.getCalendarEvents(startDateTime, endDateTime);
      setMeetings(list);
      onMeetingsLoaded(list);
    } catch {
      setError("Não foi possível carregar as reuniões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [onMeetingsLoaded, user.email, usersService]);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.dark,
              letterSpacing: "-0.02em",
              marginBottom: 2,
            }}
          >
            Suas reuniões
          </h2>
          <p style={{ fontSize: 13, color: C.grayLight }}>
            Próximos 30 dias · {user.display_name}
          </p>
        </div>
        <button
          onClick={onChangeEmail}
          style={{
            background: "none",
            border: `1px solid ${C.creamDark}`,
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 500,
            color: C.gray,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="logout" size={14} color={C.gray} />
          Trocar e-mail
        </button>
      </div>

      {/* Banner de erro */}
      {error && (
        <div
          style={{
            background: "rgba(224,64,64,0.07)",
            border: `1px solid rgba(224,64,64,0.2)`,
            color: C.redStop,
            borderRadius: 10,
            padding: "14px 18px",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>{error}</span>
          <button
            onClick={fetchMeetings}
            style={{
              background: C.redStop,
              color: C.white,
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Lista de reuniões */}
      {!loading && !error && meetings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {meetings.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMeeting(m)}
              className="meeting-row"
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  marginRight: 16,
                  flexShrink: 0,
                  background: "rgba(255,145,20,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="meetings" size={20} color={C.orange} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.dark,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.subject}
                </div>
                <div style={{ fontSize: 12, color: C.grayLight, marginTop: 2 }}>
                  {formatDate(m.start)} · {formatTime(m.start)}–{formatTime(m.end)}
                </div>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  textAlign: "right",
                  marginLeft: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: C.grayLight,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 160,
                  }}
                >
                  {m.organizer.name}
                </div>
                <Icon name="chevron" size={16} color={C.grayLighter} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !error && meetings.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              margin: "0 auto 16px",
              background: "rgba(255,145,20,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="meetings" size={24} color={C.grayLighter} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 6 }}>
            Nenhuma reunião encontrada
          </p>
          <p style={{ fontSize: 13, color: C.grayLight }}>
            Nenhuma reunião encontrada para os próximos 30 dias.
          </p>
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 16px",
        borderRadius: 12,
        background: C.white,
        border: `1px solid ${C.creamDark}`,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: C.creamDark,
          flexShrink: 0,
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 14,
            width: "60%",
            borderRadius: 6,
            background: C.creamDark,
            marginBottom: 8,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 11,
            width: "35%",
            borderRadius: 6,
            background: C.creamDark,
            animation: "pulse 1.4s ease-in-out infinite 0.2s",
          }}
        />
      </div>
    </div>
  );
}
