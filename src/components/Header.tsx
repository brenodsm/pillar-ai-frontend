import { C } from "../constants/colors";
import { Timer } from "./Timer";
import type { AppState } from "../types";

interface HeaderProps {
  sidebarView: string;
  appState: AppState;
  startTime: number | null;
}

const viewTitles: Record<string, string> = {
  home: "Gravação de Reunião",
  meetings: "Todas as Reuniões",
  atas: "Atas Geradas",
  recentes: "Reuniões Recentes",
  settings: "Configurações",
  calendario: "Calendário",
};

export function Header({ sidebarView, appState, startTime }: HeaderProps) {
  return (
    <header style={{
      height: 64, minHeight: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", borderBottom: `1px solid ${C.creamDark}`, background: C.white,
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>
        {viewTitles[sidebarView] ?? ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {appState === "recording" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "fadeIn 0.4s ease" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.redStop, animation: "pulseRec 1.5s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.redStop, fontFamily: "'JetBrains Mono', monospace" }}>
              <Timer isRunning={appState === "recording"} startTime={startTime} />
            </span>
            <span style={{ fontSize: 12, color: C.grayLight, marginLeft: 4 }}>Gravando...</span>
          </div>
        )}
        <div style={{ fontSize: 13, color: C.grayLight }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
    </header>
  );
}
