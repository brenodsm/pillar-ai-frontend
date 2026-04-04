import { C } from "../constants/colors";
import { Icon } from "../components/Icon";
import type { StoredMeeting } from "../types";

interface MeetingsViewProps {
  sidebarView: string;
  pastMeetings: StoredMeeting[];
  onViewMeeting: (meeting: StoredMeeting) => void;
  onGoHome: () => void;
}

const viewTitles: Record<string, string> = {
  meetings: "Todas as Reuniões",
  atas: "Atas Geradas",
  recentes: "Reuniões Recentes",
};

export function MeetingsView({ sidebarView, pastMeetings, onViewMeeting, onGoHome }: MeetingsViewProps) {
  const displayList = sidebarView === "atas"
    ? pastMeetings.filter((m) => m.hasAta)
    : pastMeetings;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.dark, letterSpacing: "-0.02em" }}>
            {viewTitles[sidebarView] ?? "Reuniões"}
          </h2>
          <p style={{ fontSize: 13, color: C.grayLight, marginTop: 4 }}>
            {pastMeetings.length === 0
              ? "Nenhuma reunião gravada ainda. Inicie uma gravação na tela inicial."
              : `${pastMeetings.length} ${pastMeetings.length === 1 ? "reunião gravada" : "reuniões gravadas"}`
            }
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {displayList.map((m) => (
          <div key={m.id} className="meeting-row" onClick={() => onViewMeeting(m)}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, marginRight: 16, flexShrink: 0,
              background: "rgba(255,145,20,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="meetings" size={20} color={C.orange} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{m.title}</div>
              <div style={{ fontSize: 12, color: C.grayLight, marginTop: 2 }}>{m.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{m.duration}</div>
                <div style={{ fontSize: 10, color: C.grayLighter }}>Duração</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{m.participants}</div>
                <div style={{ fontSize: 10, color: C.grayLighter }}>Participantes</div>
              </div>
              {m.hasAta && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: C.green,
                  background: "rgba(46,170,92,0.08)", padding: "4px 10px",
                  borderRadius: 6, textTransform: "uppercase",
                }}>Ata</div>
              )}
              <Icon name="chevron" size={18} color={C.grayLighter} />
            </div>
          </div>
        ))}
      </div>

      {pastMeetings.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
            background: "rgba(255,145,20,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="meetings" size={28} color={C.grayLighter} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 6 }}>Nenhuma reunião encontrada</p>
          <p style={{ fontSize: 13, color: C.grayLight }}>As reuniões gravadas aparecerão aqui.</p>
          <button
            className="btn-primary"
            onClick={onGoHome}
            style={{
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
              color: C.white, marginTop: 20,
              boxShadow: `0 4px 16px rgba(255,145,20,0.25)`,
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
