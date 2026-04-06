import { useCallback, useMemo, useState } from "react";
import { C } from "../constants/colors";
import { Icon } from "../components/Icon";
import type { StoredMeeting } from "../types";
import type { MeetingsListItem } from "./meetings/types";
import { useMeetingsList } from "./meetings/useMeetingsList";

interface MeetingsViewProps {
  sidebarView: string;
  storedMeetings: StoredMeeting[];
  onViewMeeting: (meeting: StoredMeeting) => void;
  onOpenMeetingById: (meetingId: string) => Promise<void>;
  onGoHome: () => void;
}

const viewTitles: Record<string, string> = {
  meetings: "Todas as Reuniões",
  atas: "Atas Geradas",
  recentes: "Reuniões Recentes",
};

export function MeetingsView({
  sidebarView,
  storedMeetings,
  onViewMeeting,
  onOpenMeetingById,
  onGoHome,
}: MeetingsViewProps) {
  const { meetings, loading, error, reload } = useMeetingsList(storedMeetings);
  const [openingMeetingKey, setOpeningMeetingKey] = useState<string | null>(null);

  const displayList = useMemo(() => {
    if (sidebarView === "atas") {
      return meetings.filter((meeting) => meeting.hasAta);
    }
    return meetings;
  }, [meetings, sidebarView]);

  const handleOpenMeeting = useCallback(async (meeting: MeetingsListItem) => {
    if (meeting.storedMeeting) {
      onViewMeeting(meeting.storedMeeting);
      return;
    }

    if (!meeting.meetingId) {
      return;
    }

    setOpeningMeetingKey(meeting.key);
    try {
      await onOpenMeetingById(meeting.meetingId);
    } finally {
      setOpeningMeetingKey(null);
    }
  }, [onOpenMeetingById, onViewMeeting]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.dark, letterSpacing: "-0.02em" }}>
            {viewTitles[sidebarView] ?? "Reuniões"}
          </h2>
          <p style={{ fontSize: 13, color: C.grayLight, marginTop: 4 }}>
            {displayList.length === 0
              ? "Nenhuma reunião encontrada."
              : `${displayList.length} ${displayList.length === 1 ? "reunião encontrada" : "reuniões encontradas"}`}
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
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
          }}
        >
          <span>{error}</span>
          <button
            onClick={reload}
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

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[1, 2, 3].map((index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      )}

      {!loading && displayList.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {displayList.map((meeting) => {
            const isOpening = openingMeetingKey === meeting.key;
            const isDisabled = isOpening || (!meeting.storedMeeting && !meeting.meetingId);

            return (
              <button
                key={meeting.key}
                type="button"
                className="meeting-row"
                onClick={() => {
                  void handleOpenMeeting(meeting);
                }}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  padding: 0,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.75 : 1,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, marginRight: 16, flexShrink: 0,
                  background: "rgba(255,145,20,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="meetings" size={20} color={C.orange} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{meeting.title}</div>
                  <div style={{ fontSize: 12, color: C.grayLight, marginTop: 2 }}>{meeting.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{meeting.durationLabel}</div>
                    <div style={{ fontSize: 10, color: C.grayLighter }}>Duração</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{meeting.participantsLabel}</div>
                    <div style={{ fontSize: 10, color: C.grayLighter }}>Participantes</div>
                  </div>
                  {meeting.hasAta && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: C.green,
                      background: "rgba(46,170,92,0.08)", padding: "4px 10px",
                      borderRadius: 6, textTransform: "uppercase",
                    }}>Ata</div>
                  )}
                  <Icon name="chevron" size={18} color={C.grayLighter} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && displayList.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
            background: "rgba(255,145,20,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="meetings" size={28} color={C.grayLighter} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 6 }}>Nenhuma reunião encontrada</p>
          <p style={{ fontSize: 13, color: C.grayLight }}>As reuniões sincronizadas aparecerão aqui.</p>
          <button
            className="btn-primary"
            onClick={onGoHome}
            style={{
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
              color: C.white, marginTop: 20,
              boxShadow: "0 4px 16px rgba(255,145,20,0.25)",
              fontSize: 13.5, padding: "11px 24px",
            }}
          >
            <Icon name="mic" size={18} color={C.white} />
            Iniciar Gravação
          </button>
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
