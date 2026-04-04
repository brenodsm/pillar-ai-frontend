import { C } from "../constants/colors";
import { Icon } from "./Icon";
import { AudioWave } from "./AudioWave";
import { Timer } from "./Timer";
import type { AppState } from "../types";

interface RecordingPanelProps {
  appState: AppState;
  startTime: number | null;
  showSystemAudioHint: boolean;
  onStop: () => void;
  onReset: () => void;
}

export function RecordingPanel({ appState, startTime, showSystemAudioHint, onStop, onReset }: RecordingPanelProps) {
  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: "24px 28px",
      border: `1px solid ${appState === "recording" ? "rgba(255,145,20,0.25)" : C.creamDark}`,
      boxShadow: appState === "recording" ? "0 4px 24px rgba(255,145,20,0.08)" : "0 2px 8px rgba(0,0,0,0.03)",
      marginBottom: 24, transition: "all 0.3s ease",
    }}>

      {/* Banner de orientação para áudio do sistema */}
      {showSystemAudioHint && (
        <div style={{
          background: "rgba(255,145,20,0.07)",
          border: "1px solid rgba(255,145,20,0.25)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#b85e00", marginBottom: 4 }}>
            Participantes online?
          </div>
          <div style={{ fontSize: 12.5, color: "#7a4500", lineHeight: 1.5 }}>
            Selecione <strong>Tela Inteira</strong> e ative <strong>Compartilhar áudio</strong> para capturar o áudio deles.
            Se a reunião for presencial, <strong>cancele</strong>.
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: appState === "recording" ? C.redStop : appState === "processing" ? C.orange : C.green,
            animation: appState === "recording" ? "pulseRec 1.5s infinite" : "none",
          }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>
            {appState === "recording" && "Gravando reunião"}
            {appState === "processing" && "Processando áudio..."}
            {appState === "finished" && "Gravação finalizada"}
          </span>
        </div>
        <div style={{
          fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          color: appState === "recording" ? C.dark : C.grayLight,
        }}>
          <Timer isRunning={appState === "recording"} startTime={startTime} />
        </div>
      </div>

      {appState === "processing" ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: `3px solid ${C.creamDark}`,
            borderTopColor: C.orange,
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ fontSize: 14, color: C.grayLight }}>Transcrevendo e gerando ata...</p>
          <p style={{ fontSize: 12, color: C.grayLighter, marginTop: 6 }}>Isso pode levar alguns segundos</p>
        </div>
      ) : (
        <AudioWave active={appState === "recording"} />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 }}>
        {appState === "recording" && (
          <button
            className="btn-primary btn-primary-centered-label"
            onClick={onStop}
            style={{ background: C.redStop, color: C.white, boxShadow: "0 4px 16px rgba(224,64,64,0.3)" }}
          >
            <Icon name="stop" size={18} color={C.white} />
            <span>Finalizar Gravação</span>
          </button>
        )}
        {appState === "finished" && (
          <button
            className="btn-primary btn-primary-centered-label"
            onClick={onReset}
            style={{
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
              color: C.white,
              boxShadow: `0 4px 20px rgba(255,145,20,0.3)`,
            }}
          >
            <Icon name="mic" size={18} color={C.white} />
            <span>Nova Gravação</span>
          </button>
        )}
      </div>
    </div>
  );
}
