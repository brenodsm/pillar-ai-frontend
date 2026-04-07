import { useState } from "react";
import { C } from "../constants/colors";
import { Icon } from "../components/Icon";
import { RecordingPanel } from "../components/RecordingPanel";
import { TabsPanel } from "../components/TabsPanel";
import { ParticipantsPanel } from "../components/ParticipantsPanel";
import { MissingResponsibleTag } from "../components/MissingResponsibleTag";
import { isMissingActionResponsible } from "../utils/actionResponsible";
import type { AppState, ProcessResult, Participant, StoredMeeting, CalendarMeeting, SessionUser } from "../types";

interface HomeViewProps {
  appState: AppState;
  startTime: number | null;
  showPanel: boolean;
  error: string | null;
  result: ProcessResult | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  ataText: string;
  setAtaText: (text: string) => void;
  transcriptionText: string;
  participants: Participant[];
  emailInput: string;
  emailSent: boolean;
  isSending: boolean;
  sendError: string | null;
  setEmailInput: (v: string) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onAddParticipant: () => void;
  onRemoveParticipant: (email: string) => void;
  onEmailKeyDown: (e: React.KeyboardEvent) => void;
  onSendEmails: () => void;
  onAiRewrite: (instruction: string) => Promise<void>;
  onUpdateActionItems: (actionItems: ProcessResult["minutes"]["action_items"]) => Promise<void>;
  isAiRewriting: boolean;
  calendarMeetings: CalendarMeeting[];
  pastMeetings: StoredMeeting[];
  user: SessionUser | null;
  showSystemAudioHint: boolean;
  hasAta: boolean;
  isAtaConfirmed: boolean;
  isConfirmingAta: boolean;
  onConfirmAta: () => Promise<void>;
}

const ROOM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Sala Ipê":     { bg: "rgba(255,145,20,0.1)", text: "#b85e00", dot: "#FF9114" },
  "Sala Aroeira": { bg: "rgba(46,170,92,0.1)",  text: "#1a7a42", dot: "#2EAA5C" },
  "Sala Cedro":   { bg: "rgba(74,108,214,0.1)", text: "#2d4ab0", dot: "#4a6cd6" },
};
const DEFAULT_ROOM_COLOR = { bg: "rgba(138,143,143,0.1)", text: "#555a5a", dot: "#8A8F8F" };

function getRoomColor(location: string) {
  return ROOM_COLORS[location] ?? DEFAULT_ROOM_COLOR;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function parseDurationMinutes(dur: string): number {
  const h = dur.match(/(\d+)h/);
  const m = dur.match(/(\d+)min/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

export function HomeView({
  appState, startTime, showPanel, error, result,
  activeTab, setActiveTab, notes, setNotes, ataText, setAtaText, transcriptionText,
  participants, emailInput, emailSent, isSending, sendError, setEmailInput,
  onStart, onStop, onReset, onAddParticipant, onRemoveParticipant, onEmailKeyDown, onSendEmails,
  onAiRewrite, isAiRewriting,
  onUpdateActionItems,
  calendarMeetings, pastMeetings, user, showSystemAudioHint,
  hasAta, isAtaConfirmed, isConfirmingAta, onConfirmAta
}: HomeViewProps) {
  const [agendaModal, setAgendaModal] = useState<CalendarMeeting | null>(null);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

  // ── Dashboard computed values ──────────────────────────────────────────────

  const todayISO = new Date().toISOString().split("T")[0];
  const todayMeetings = calendarMeetings.filter((m) => m.start.split("T")[0] === todayISO);
  const upcomingMeetings = calendarMeetings.filter((m) => m.start.split("T")[0] > todayISO).slice(0, 3);

  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  const atasCount = pastMeetings.filter((m) => m.hasAta).length;
  const atasPct = pastMeetings.length > 0 ? Math.round((atasCount / pastMeetings.length) * 100) : 0;

  const uniqueParticipants = new Set<string>();
  pastMeetings.forEach((m) => m.result?.minutes?.participants?.forEach((p) => uniqueParticipants.add(p)));

  const totalMins = pastMeetings.reduce((acc, m) => acc + parseDurationMinutes(m.duration), 0);
  const totalHoursStr = totalMins >= 60
    ? `${Math.floor(totalMins / 60)}h${totalMins % 60 > 0 ? ` ${totalMins % 60}m` : ""}`
    : `${totalMins}min`;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const emailLocalPart = user?.email?.trim().split("@")[0] ?? "";
  const emailFirstName = emailLocalPart.split(".")[0] ?? "";
  const normalizedFirstName = emailFirstName || user?.display_name?.split(" ")[0] || "Usuário";
  const firstName = normalizedFirstName.charAt(0).toUpperCase() + normalizedFirstName.slice(1).toLowerCase();
  const hasActionWithoutResponsible = Boolean(
    result?.minutes.action_items.some((item) => isMissingActionResponsible(item.responsible)),
  );
  const isConfirmAtaDisabled = isConfirmingAta || hasActionWithoutResponsible;

  // ── Recording / Processing / Finished ─────────────────────────────────────

  if (appState !== "idle") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {error && (
          <div style={{
            background: "rgba(224,64,64,0.08)", border: `1px solid rgba(224,64,64,0.2)`,
            color: C.redStop, padding: "14px 20px", borderRadius: 12, marginBottom: 24,
            fontSize: 14, fontWeight: 500, animation: "fadeIn 0.3s ease",
          }}>
            {error}
          </div>
        )}
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {!hasAta && <RecordingPanel appState={appState} startTime={startTime} showSystemAudioHint={showSystemAudioHint} onStop={onStop} onReset={onReset} />}
          {showPanel && appState !== "processing" && (
            <TabsPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              notes={notes}
              setNotes={setNotes}
              appState={appState}
              result={result}
              ataText={ataText}
              setAtaText={setAtaText}
              transcriptionText={transcriptionText}
              participants={participants}
              onAiRewrite={onAiRewrite}
              onUpdateActionItems={onUpdateActionItems}
              isAiRewriting={isAiRewriting}
              isAtaConfirmed={isAtaConfirmed}
              isConfirmingAta={isConfirmingAta}
              onConfirmAta={onConfirmAta}
              onOpenParticipantsModal={() => setIsParticipantsModalOpen(true)}
            />
          )}

          {appState === "finished" && result && !isAtaConfirmed && (
            <div style={{ marginTop: 24, textAlign: "right" }}>
              {hasActionWithoutResponsible && (
                <div style={{ marginBottom: 10 }}>
                  <MissingResponsibleTag text="Atribua um responsável para todas as ações" />
                </div>
              )}
              <button
                className="btn-primary"
                onClick={onConfirmAta}
                disabled={isConfirmAtaDisabled}
                style={{
                  background: isConfirmAtaDisabled ? C.creamDark : C.orange,
                  color: isConfirmAtaDisabled ? C.grayLight : C.white,
                  boxShadow: isConfirmAtaDisabled ? "none" : `0 4px 16px rgba(255,145,20,0.3)`,
                  fontSize: 14.5, padding: "14px 28px", borderRadius: 12,
                  transition: "all 0.3s ease",
                  cursor: isConfirmAtaDisabled ? "not-allowed" : "pointer",
                }}
              >
                {isConfirmingAta ? "Confirmando..." : "Confirmar Ata"}
              </button>
            </div>
          )}

          {appState === "finished" && result && isParticipantsModalOpen && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setIsParticipantsModalOpen(false); }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1100,
                background: "rgba(20,22,22,0.48)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Gerenciar participantes"
                style={{
                  width: "min(760px, 100%)",
                  maxHeight: "min(86vh, 860px)",
                  overflow: "auto",
                  background: C.white,
                  borderRadius: 20,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                  border: `1px solid ${C.creamDark}`,
                }}
              >
                <div style={{
                  padding: "20px 22px 14px",
                  borderBottom: `1px solid ${C.creamDark}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.dark }}>
                      Gerenciar participantes
                    </div>
                    <div style={{ fontSize: 12.5, color: C.grayLight, marginTop: 3 }}>
                      Mantenha a lista atualizada antes do envio da ata.
                    </div>
                  </div>
                  <button
                    aria-label="Fechar modal de participantes"
                    className="danger-icon-btn"
                    onClick={() => setIsParticipantsModalOpen(false)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: `1px solid ${C.creamDark}`,
                      background: C.bg,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 240ms cubic-bezier(0.22, 1, 0.36, 1), color 200ms ease, box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms ease",
                      transform: "translateY(0)",
                      color: C.grayLight,
                    }}
                  >
                    <Icon name="x" size={15} color="currentColor" />
                  </button>
                </div>

                <div style={{ padding: "0 22px 20px" }}>
                  <ParticipantsPanel
                    participants={participants}
                    emailInput={emailInput}
                    emailSent={emailSent}
                    isSending={isSending}
                    sendError={sendError}
                    setEmailInput={setEmailInput}
                    onAdd={onAddParticipant}
                    onRemove={onRemoveParticipant}
                    onKeyDown={onEmailKeyDown}
                    onSend={onSendEmails}
                    isAtaConfirmed={isAtaConfirmed}
                    inModal
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard (idle) ───────────────────────────────────────────────────────

  return (
    <div style={{ animation: "fadeIn 0.45s ease" }}>
      {error && (
        <div style={{
          background: "rgba(224,64,64,0.08)", border: `1px solid rgba(224,64,64,0.2)`,
          color: C.redStop, padding: "14px 20px", borderRadius: 12, marginBottom: 20,
          fontSize: 14, fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Hero banner */}
      <div style={{
        borderRadius: 18, padding: "28px 32px",
        background: "linear-gradient(130deg, #2C2E2E 0%, #3a2800 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 22, overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", right: -50, top: -50, width: 240, height: 240, borderRadius: "50%", border: "44px solid rgba(255,145,20,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -70, width: 180, height: 180, borderRadius: "50%", border: "32px solid rgba(255,200,90,0.05)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,200,90,0.65)", marginBottom: 8, letterSpacing: "0.03em" }}>
            {greeting}, {firstName}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.25 }}>
            Inteligência que sustenta<br />suas decisões.
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            {todayMeetings.length > 0 ? (
              <>Você tem{" "}<span style={{ color: C.orangeLight, fontWeight: 600 }}>{todayMeetings.length} {todayMeetings.length === 1 ? "reunião" : "reuniões"}</span>{" "}agendada{todayMeetings.length !== 1 ? "s" : ""} para hoje.</>
            ) : (
              <>Nenhuma reunião agendada para hoje.</>
            )}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={onStart}
          style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`, color: C.white, boxShadow: "0 6px 24px rgba(255,145,20,0.45)", fontSize: 14, padding: "14px 28px", flexShrink: 0, whiteSpace: "nowrap", animation: "pulseOrange 3s infinite" }}
        >
          <Icon name="mic" size={18} color={C.white} />
          Iniciar Gravação
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Reuniões agendadas",    value: String(calendarMeetings.length), icon: "meetings", sub: "próximos 30 dias",                                   color: C.orange  },
          { label: "Atas geradas",          value: String(atasCount),               icon: "doc",      sub: pastMeetings.length > 0 ? `${atasPct}% do total` : "nenhuma gravação ainda", color: C.green   },
          { label: "Participantes únicos",  value: String(uniqueParticipants.size), icon: "users",    sub: pastMeetings.length > 0 ? "entre reuniões gravadas" : "nenhuma gravação ainda", color: "#4a6cd6" },
          { label: "Tempo gravado",         value: pastMeetings.length > 0 ? totalHoursStr : "0min", icon: "clock", sub: "total acumulado", color: "#b85e00" },
        ].map((m, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.creamDark}`, display: "flex", flexDirection: "column", gap: 10, animation: `fadeIn 0.4s ease ${i * 60}ms both` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.grayLight }}>{m.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${m.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={m.icon} size={16} color={m.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.dark, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 11.5, color: C.grayLighter, fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column: Today + Recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Painel esquerdo: reuniões de hoje */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.creamDark}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.creamDark}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="clock" size={16} color={C.orange} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>Hoje · {todayLabel}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.orange, background: "rgba(255,145,20,0.1)", padding: "3px 8px", borderRadius: 5 }}>
              {todayMeetings.length} {todayMeetings.length === 1 ? "reunião" : "reuniões"}
            </span>
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {todayMeetings.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13 }}>
                Nenhuma reunião hoje
              </div>
            )}
            {todayMeetings.map((m) => {
              const rc = getRoomColor(m.location);
              return (
                <div
                  key={m.id}
                  onClick={() => setAgendaModal(m)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 11, background: C.bg, cursor: "pointer", border: "1px solid transparent", transition: "all 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,145,20,0.2)"; e.currentTarget.style.background = C.white; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = C.bg; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 40, paddingTop: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{formatTime(m.start)}</span>
                    <div style={{ width: 1, flex: 1, background: C.creamDark, margin: "4px 0" }} />
                    <span style={{ fontSize: 11, color: C.grayLighter }}>{formatTime(m.end)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, marginBottom: 5 }}>{m.subject}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {m.location && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: rc.text, background: rc.bg, padding: "2px 8px", borderRadius: 5, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: rc.dot }} />
                          {m.location}
                        </span>
                      )}
                      <span style={{ fontSize: 11.5, color: C.grayLight }}>{m.attendees.length} pessoas</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "rgba(255,145,20,0.08)", marginTop: 2 }}>
                    <Icon name="mic" size={14} color={C.orange} />
                  </div>
                </div>
              );
            })}

            {/* Próximos dias */}
            {upcomingMeetings.length > 0 && (
              <div style={{ padding: "8px 4px 2px", borderTop: `1px solid ${C.creamDark}`, marginTop: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLighter, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Próximos dias</div>
                {upcomingMeetings.map((m) => {
                  const dayNum = new Date(m.start).toLocaleDateString("pt-BR", { day: "numeric", timeZone: "America/Sao_Paulo" });
                  const monthShort = new Date(m.start).toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" });
                  return (
                    <div
                      key={m.id}
                      onClick={() => setAgendaModal(m)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bg, border: `1px solid ${C.creamDark}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, lineHeight: 1 }}>{dayNum}</span>
                        <span style={{ fontSize: 9, color: C.grayLight, textTransform: "uppercase" }}>{monthShort}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.subject}</div>
                        <div style={{ fontSize: 11.5, color: C.grayLight }}>{formatTime(m.start)}{m.location ? ` · ${m.location}` : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel direito: atividade recente */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.creamDark}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.creamDark}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="doc" size={16} color={C.orange} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>Atividade Recente</span>
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            {pastMeetings.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,145,20,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon name="mic" size={20} color={C.grayLighter} />
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, marginBottom: 4 }}>Nenhuma gravação ainda</p>
                <p style={{ fontSize: 12.5, color: C.grayLight }}>Suas reuniões gravadas aparecerão aqui.</p>
              </div>
            )}
            {pastMeetings.slice(0, 5).map((m, i) => (
              <div
                key={m.id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 11, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(255,145,20,${0.07 + i * 0.015})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="mic" size={16} color={C.orange} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                  <div style={{ fontSize: 11.5, color: C.grayLight, marginTop: 1 }}>{m.date} · {m.duration} · {m.participants} participantes</div>
                </div>
                {m.hasAta
                  ? <span style={{ fontSize: 10.5, fontWeight: 600, color: C.green, background: "rgba(46,170,92,0.08)", padding: "3px 9px", borderRadius: 5, flexShrink: 0 }}>Ata pronta</span>
                  : <span style={{ fontSize: 10.5, fontWeight: 600, color: C.grayLight, background: C.bg, padding: "3px 9px", borderRadius: 5, flexShrink: 0, border: `1px solid ${C.creamDark}` }}>Processando</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de reunião */}
      {agendaModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setAgendaModal(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,22,22,0.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ width: 460, background: C.white, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.creamDark}` }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{agendaModal.subject}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: C.grayLight, background: C.bg, padding: "4px 10px", borderRadius: 7 }}>
                  {new Date(agendaModal.start).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" })} · {formatTime(agendaModal.start)} – {formatTime(agendaModal.end)}
                </span>
                {agendaModal.location && (
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: getRoomColor(agendaModal.location).text, background: getRoomColor(agendaModal.location).bg, padding: "4px 10px", borderRadius: 7 }}>
                    {agendaModal.location}
                  </span>
                )}
              </div>
            </div>
            <div style={{ padding: "16px 24px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLighter, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Participantes · {agendaModal.attendees.length}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 20, maxHeight: 240, overflowY: "auto" }}>
                {agendaModal.attendees.map((p) => (
                  <div key={p.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: C.bg }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: p.email === user?.email
                        ? `linear-gradient(135deg,${C.orange},${C.orangeLight})`
                        : "linear-gradient(135deg,#888,#aaa)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: C.white, fontSize: 11, fontWeight: 700,
                    }}>
                      {p.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: C.grayLight }}>{p.email}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setAgendaModal(null); onStart(); }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 0", border: "none", borderRadius: 12, background: `linear-gradient(135deg,${C.orange},${C.orangeDark})`, color: C.white, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(255,145,20,0.35)" }}
              >
                <Icon name="mic" size={18} color={C.white} />
                Iniciar Gravação desta Reunião
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

