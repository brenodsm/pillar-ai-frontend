import { useEffect, useMemo, useState } from "react";
import { C } from "../constants/colors";
import { Icon } from "./Icon";
import { MissingResponsibleTag } from "./MissingResponsibleTag";
import type { AppState, Participant, ProcessResult } from "../types";
import { formatDateToBrDate } from "../utils/dateFormat";
import { isMissingActionResponsible } from "../utils/actionResponsible";

interface TabsPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  appState: AppState;
  result: ProcessResult | null;
  ataText: string;
  setAtaText: (text: string) => void;
  transcriptionText: string;
  participants: Participant[];
  onAiRewrite: (instruction: string) => Promise<void>;
  onUpdateActionItems: (actionItems: ProcessResult["minutes"]["action_items"]) => Promise<void>;
  isAiRewriting: boolean;
  isAtaConfirmed: boolean;
  isConfirmingAta: boolean;
  onConfirmAta: () => Promise<void>;
  onOpenParticipantsModal?: () => void;
}

const ATA_HEADING_LABELS: Record<string, string> = {
  "ata de reunião": "Ata de reunião",
  "ata da reunião": "Ata da reunião",
  resumo: "Resumo",
  "tópicos discutidos": "Tópicos discutidos",
  "topicos discutidos": "Tópicos discutidos",
  "ações definidas": "Ações definidas",
  "acoes definidas": "Ações definidas",
  "decisões": "Decisões",
  decisoes: "Decisões",
  "próximos passos": "Próximos passos",
  "proximos passos": "Próximos passos",
};

function normalizeHeading(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function toDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }
  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function formatParticipantOption(participant: Participant): string {
  const name = participant.name?.trim();
  const email = participant.email?.trim();
  if (name && email) {
    return `${name} (${email})`;
  }
  return name || email || "";
}

function getParticipantInitials(participant: Participant): string {
  const fromName = participant.name
    .split(" ")
    .map((word) => word.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (fromName) {
    return fromName;
  }

  const fromEmail = participant.email.trim().charAt(0).toUpperCase();
  return fromEmail || "?";
}

function renderAtaText(ataText: string) {
  const lines = ataText.split("\n");
  const nodes: React.ReactNode[] = [];
  let activeSection = "";

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();
    const normalizedHeading = normalizeHeading(trimmedLine);
    const headingLabel = ATA_HEADING_LABELS[normalizedHeading];

    if (!trimmedLine) {
      nodes.push(<div key={`empty-${index}`} style={{ height: 8 }} />);
      index += 1;
      continue;
    }

    if (headingLabel && (normalizedHeading === "ata de reunião" || normalizedHeading === "ata da reunião")) {
      activeSection = normalizedHeading;
      nodes.push(
        <h3
          key={`title-${index}`}
          style={{
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.25,
            color: C.dark,
            margin: "0 0 12px",
          }}
        >
          {headingLabel}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (headingLabel) {
      activeSection = normalizedHeading;
      nodes.push(
        <h3
          key={`section-${index}`}
          style={{
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.35,
            color: C.dark,
            margin: "10px 0 8px",
          }}
        >
          {headingLabel}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (/^━━━━━━━━/.test(trimmedLine)) {
      nodes.push(
        <div
          key={`divider-${index}`}
          style={{
            width: "100%",
            maxWidth: 520,
            height: 2,
            borderRadius: 99,
            background: C.dark,
            opacity: 0.75,
            margin: "10px 0 14px",
          }}
        />,
      );
      index += 1;
      continue;
    }

    if (/^(Reunião|Data|Participantes):/.test(trimmedLine)) {
      nodes.push(
        <div
          key={`meta-${index}`}
          style={{
            fontSize: 14.5,
            lineHeight: 1.45,
            color: C.dark,
            whiteSpace: "pre-wrap",
            margin: "0 0 4px",
          }}
        >
          {line}
        </div>,
      );
      index += 1;
      continue;
    }

    const isActionsSection = activeSection === "ações definidas" || activeSection === "acoes definidas";
    if (isActionsSection && /^•\s*Responsável:/i.test(trimmedLine)) {
      const responsible = trimmedLine.replace(/^•\s*Responsável:\s*/i, "").trim();
      let description = "";
      let deadline = "";
      let cursor = index + 1;

      while (cursor < lines.length) {
        const candidate = lines[cursor].trim();
        if (!candidate) {
          break;
        }
        if (/^•\s*Responsável:/i.test(candidate) || /^━━━━━━━━/.test(candidate)) {
          break;
        }
        if (ATA_HEADING_LABELS[normalizeHeading(candidate)]) {
          break;
        }

        if (/^Ação:/i.test(candidate)) {
          description = candidate.replace(/^Ação:\s*/i, "").trim();
        }

        if (/^Prazo:/i.test(candidate)) {
          deadline = candidate.replace(/^Prazo:\s*/i, "").trim();
        }

        cursor += 1;
      }

      nodes.push(
        <div
          key={`action-${index}`}
          style={{
            border: `1px solid ${C.creamDark}`,
            background: C.white,
            borderRadius: 10,
            padding: "12px 14px",
            margin: "0 0 10px",
          }}
        >
          <div style={{ fontSize: 12, color: C.grayLight, fontWeight: 600, marginBottom: 3 }}>Responsável</div>
          <div style={{ fontSize: 14, color: C.dark, fontWeight: 600 }}>
            {responsible ? responsible : <MissingResponsibleTag size="small" />}
          </div>
          {description ? (
            <>
              <div style={{ fontSize: 12, color: C.grayLight, fontWeight: 600, marginTop: 10, marginBottom: 3 }}>Ação</div>
              <div style={{ fontSize: 14, color: C.dark, lineHeight: 1.5 }}>{description}</div>
            </>
          ) : null}
          {deadline ? (
            <div style={{ fontSize: 12.5, color: C.gray, marginTop: 10 }}>
              Prazo: <strong>{deadline}</strong>
            </div>
          ) : null}
        </div>,
      );

      index = cursor;
      continue;
    }

    nodes.push(
      <div
        key={`line-${index}`}
        style={{
          fontSize: 14.5,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: "0 0 6px",
        }}
      >
        {line}
      </div>,
    );
    index += 1;
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.dark }}>
      {nodes}
    </div>
  );
}

export function TabsPanel({
  activeTab,
  setActiveTab,
  notes,
  setNotes,
  appState,
  result,
  ataText,
  setAtaText,
  transcriptionText,
  participants,
  onAiRewrite,
  onUpdateActionItems,
  isAiRewriting,
  isAtaConfirmed,
  isConfirmingAta,
  onConfirmAta,
  onOpenParticipantsModal,
}: TabsPanelProps) {
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [editableActions, setEditableActions] = useState<ProcessResult["minutes"]["action_items"]>([]);
  const [isSavingActions, setIsSavingActions] = useState(false);
  const [actionsEditError, setActionsEditError] = useState<string | null>(null);

  const isAtaLockedByActionEditing = isEditingActions;

  useEffect(() => {
    if (!isEditingActions) {
      setEditableActions((result?.minutes.action_items ?? []).map((item) => ({ ...item })));
    }
  }, [isEditingActions, result]);

  useEffect(() => {
    if (isAtaLockedByActionEditing) {
      setShowAiInput(false);
      setAiInstruction("");
    }
  }, [isAtaLockedByActionEditing]);

  const responsibleOptions = useMemo(() => {
    const options = new Set<string>();

    participants.forEach((participant) => {
      const participantOption = formatParticipantOption(participant);
      if (participantOption) {
        options.add(participantOption);
      }
    });

    (result?.minutes.participants ?? []).forEach((participantLabel) => {
      const normalized = participantLabel.trim();
      if (normalized) {
        options.add(normalized);
      }
    });

    editableActions.forEach((item) => {
      const normalized = item.responsible.trim();
      if (normalized && !isMissingActionResponsible(normalized)) {
        options.add(normalized);
      }
    });

    return Array.from(options).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [editableActions, participants, result?.minutes.participants]);

  const hasEmptyActionDescription = editableActions.some((item) => !item.description.trim());
  const hasActionWithoutResponsible = editableActions.some((item) => isMissingActionResponsible(item.responsible));
  const isSaveActionsDisabled = isAiRewriting || hasEmptyActionDescription || hasActionWithoutResponsible || isSavingActions;

  const handleSaveActions = async () => {
    if (hasEmptyActionDescription) {
      setActionsEditError("Preencha a descrição de todas as ações antes de salvar.");
      return;
    }

    if (hasActionWithoutResponsible) {
      setActionsEditError("Atribua um responsável para cada ação antes de salvar.");
      return;
    }

    const normalized = editableActions.map((item) => {
      const deadline = item.deadline?.trim();
      return {
        description: item.description.trim(),
        responsible: item.responsible.trim(),
        deadline: deadline || undefined,
      };
    });
    setIsSavingActions(true);
    setActionsEditError(null);
    try {
      await onUpdateActionItems(normalized);
      setIsEditingActions(false);
    } catch (err) {
      setActionsEditError(err instanceof Error ? err.message : "Erro ao salvar alterações das ações.");
    } finally {
      setIsSavingActions(false);
    }
  };

  const handleCancelActionEditing = () => {
    setEditableActions((result?.minutes.action_items ?? []).map((item) => ({ ...item })));
    setIsEditingActions(false);
    setActionsEditError(null);
  };

  void setAtaText;
  void isConfirmingAta;
  void onConfirmAta;
  return (
    <div style={{
      background: C.white, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.creamDark}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      animation: "panelOpen 0.5s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.creamDark}`, padding: "0 8px", background: C.bg }}>
        <button className={`tab-btn ${activeTab === "notas" ? "active" : ""}`} onClick={() => setActiveTab("notas")}>
          Notas da Reunião
        </button>
        <button className={`tab-btn ${activeTab === "transcricao" ? "active" : ""}`} onClick={() => setActiveTab("transcricao")}>
          Transcrição
        </button>
        {result && (
          <button
            className={`tab-btn ${activeTab === "ata" ? "active" : ""}`}
            onClick={() => setActiveTab("ata")}
            style={{ animation: "tabSlide 0.4s ease" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              Ata
              <span style={{
                fontSize: 9, fontWeight: 700, background: C.orange,
                color: C.white, padding: "2px 7px", borderRadius: 6,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>Nova</span>
            </span>
          </button>
        )}
        {result && (
          <button
            className={`tab-btn ${activeTab === "acoes" ? "active" : ""}`}
            onClick={() => setActiveTab("acoes")}
          >
            Ações
          </button>
        )}
        {appState === "finished" && result && onOpenParticipantsModal && (
          <div style={{ marginLeft: "auto", padding: "8px 4px 8px 12px" }}>
            <button
              aria-label={`Gerenciar participantes (${participants.length})`}
              onClick={onOpenParticipantsModal}
              className="participants-chip"
              style={{
                border: `1px solid rgba(255,145,20,0.35)`,
                background: C.white,
                borderRadius: 14,
                padding: "6px 10px 6px 8px",
                color: C.dark,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                whiteSpace: "nowrap",
                minHeight: 46,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: C.orange,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="plus" size={14} color={C.white} />
              </span>

              <span className="participants-chip-label">Participantes</span>

              <span
                aria-hidden="true"
                style={{ display: "inline-flex", alignItems: "center", marginLeft: 2 }}
              >
                {participants.slice(0, 3).map((participant, index) => (
                  <span
                    key={participant.email}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      marginLeft: index === 0 ? 0 : -7,
                      border: `1.5px solid ${C.white}`,
                      background: participant.isOwner ? C.orangeLight : C.grayLighter,
                      color: participant.isOwner ? C.white : C.gray,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getParticipantInitials(participant)}
                  </span>
                ))}
                {participants.length > 3 && (
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      marginLeft: -7,
                      border: `1.5px solid ${C.white}`,
                      background: C.creamDark,
                      color: C.grayLight,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +{participants.length - 3}
                  </span>
                )}
              </span>

              <span
                aria-hidden="true"
                style={{
                  minWidth: 25,
                  height: 25,
                  borderRadius: 8,
                  background: C.cream,
                  color: C.orange,
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 7px",
                  marginLeft: 2,
                }}
              >
                {participants.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "28px 32px", minHeight: 320 }}>
        {/* Notas */}
        {activeTab === "notas" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="note" size={18} color={C.orange} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Notas da Reunião</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={"Digite suas anotações aqui durante a reunião...\n\n• Pontos importantes\n• Decisões tomadas\n• Ações pendentes"}
              style={{ minHeight: 260 }}
            />
          </div>
        )}

        {/* Transcrição */}
        {activeTab === "transcricao" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="mic" size={18} color={C.orange} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Transcrição</span>
            </div>
            {appState === "recording" ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: `3px solid ${C.creamDark}`,
                  borderTopColor: C.orange,
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }} />
                <p style={{ fontSize: 14, color: C.grayLight }}>Transcrevendo em tempo real...</p>
                <p style={{ fontSize: 12, color: C.grayLighter, marginTop: 6 }}>
                  A transcrição completa será exibida ao finalizar a gravação
                </p>
              </div>
            ) : result ? (
              <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.8, color: C.dark, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {transcriptionText}
              </pre>
            ) : (
              <p style={{ fontSize: 14, color: C.grayLight, textAlign: "center", padding: "40px 0" }}>
                Nenhuma transcrição disponível.
              </p>
            )}
          </div>
        )}

        {/* Ata */}
        {activeTab === "ata" && result && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="doc" size={18} color={C.orange} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Ata da Reunião</span>
                {isAtaConfirmed && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.green,
                    background: "rgba(46,170,92,0.12)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                  >
                    Confirmada
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!isAtaConfirmed && (
                  <button
                    onClick={() => {
                      if (isAtaLockedByActionEditing) {
                        return;
                      }
                      setShowAiInput(!showAiInput);
                      setAiInstruction("");
                    }}
                    disabled={isAiRewriting || isAtaLockedByActionEditing}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: `1px solid ${C.orange}`,
                      background: isAtaLockedByActionEditing
                        ? C.creamDark
                        : (showAiInput ? C.orange : `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`),
                      cursor: (isAiRewriting || isAtaLockedByActionEditing) ? "not-allowed" : "pointer",
                      fontSize: 12, fontWeight: 600,
                      fontFamily: "inherit",
                      color: isAtaLockedByActionEditing ? C.grayLight : C.white,
                      transition: "all 0.2s",
                      display: "inline-flex", alignItems: "center", gap: 6,
                      boxShadow: isAtaLockedByActionEditing ? "none" : `0 2px 8px rgba(255,145,20,0.3)`,
                    }}
                  >
                    <Icon name="sparkles" size={14} color={isAtaLockedByActionEditing ? C.grayLight : C.white} />
                    Editar Ata
                  </button>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(ataText)}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.creamDark}`,
                    background: C.white, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    fontFamily: "inherit", color: C.dark, transition: "all 0.2s",
                  }}
                >
                  Copiar
                </button>
              </div>
            </div>

            {isAtaLockedByActionEditing && (
              <div style={{
                border: `1px solid ${C.creamDark}`,
                background: C.bg,
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: 12.5,
                color: C.gray,
              }}
              >
                A edição da ata está bloqueada enquanto você edita as ações.
              </div>
            )}

            {/* AI Edit Input */}
            {showAiInput && !isAtaLockedByActionEditing && (
              <div style={{
                background: `linear-gradient(135deg, rgba(255,145,20,0.04), rgba(255,200,90,0.06))`,
                border: `1px solid rgba(255,145,20,0.25)`,
                borderRadius: 12, padding: "16px 20px", marginBottom: 16,
                animation: "fadeIn 0.3s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Icon name="sparkles" size={16} color={C.orange} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                    O que você gostaria de alterar na ata?
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <textarea
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && aiInstruction.trim()) {
                        e.preventDefault();
                        onAiRewrite(aiInstruction.trim());
                        setAiInstruction("");
                        setShowAiInput(false);
                      }
                    }}
                    placeholder="Ex: Adicione mais detalhes sobre o tópico de orçamento, corrija o nome do João para João Silva..."
                    disabled={isAiRewriting}
                    style={{
                      flex: 1, minHeight: 60, maxHeight: 120, resize: "vertical",
                      fontFamily: "inherit", fontSize: 13, lineHeight: 1.6,
                      color: C.dark, background: C.white,
                      border: `1px solid ${C.creamDark}`, borderRadius: 8,
                      padding: "10px 14px", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      onClick={() => {
                        if (aiInstruction.trim()) {
                          onAiRewrite(aiInstruction.trim());
                          setAiInstruction("");
                          setShowAiInput(false);
                        }
                      }}
                      disabled={!aiInstruction.trim() || isAiRewriting}
                      style={{
                        padding: "8px 18px", borderRadius: 8,
                        border: "none",
                        background: aiInstruction.trim() && !isAiRewriting
                          ? `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`
                          : C.creamDark,
                        cursor: aiInstruction.trim() && !isAiRewriting ? "pointer" : "not-allowed",
                        fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit",
                        color: aiInstruction.trim() && !isAiRewriting ? C.white : C.grayLight,
                        transition: "all 0.2s",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <Icon name="send" size={13} color={aiInstruction.trim() && !isAiRewriting ? C.white : C.grayLight} />
                      Enviar
                    </button>
                    <button
                      onClick={() => { setShowAiInput(false); setAiInstruction(""); }}
                      style={{
                        padding: "8px 18px", borderRadius: 8,
                        border: `1px solid ${C.creamDark}`,
                        background: C.white,
                        cursor: "pointer",
                        fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit",
                        color: C.grayLight,
                        transition: "all 0.2s",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Rewriting Indicator */}
            {isAiRewriting && (
              <div style={{
                background: `linear-gradient(135deg, rgba(255,145,20,0.06), rgba(255,200,90,0.08))`,
                border: `1px solid rgba(255,145,20,0.2)`,
                borderRadius: 12, padding: "16px 20px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 12,
                animation: "fadeIn 0.3s ease",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `3px solid ${C.creamDark}`,
                  borderTopColor: C.orange,
                  animation: "spin 1s linear infinite",
                  flexShrink: 0,
                }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                    A AI está reescrevendo a ata...
                  </span>
                  <p style={{ fontSize: 12, color: C.grayLight, marginTop: 2 }}>
                    Isso pode levar alguns segundos
                  </p>
                </div>
              </div>
            )}
            <div style={{ background: C.bg, borderRadius: 12, padding: "28px 32px", border: `1px solid ${C.creamDark}`, transition: "border-color 0.2s" }}>
              {renderAtaText(ataText)}
            </div>
          </div>
        )}

        {/* Ações */}
        {activeTab === "acoes" && result && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="users" size={18} color={C.orange} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Ações definidas</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.darkMid,
                    background: C.cream,
                    borderRadius: 99,
                    padding: "2px 8px",
                  }}
                  >
                    {editableActions.length}
                  </span>
                </div>
                {isEditingActions && (
                  <span style={{ fontSize: 12.5, color: C.gray }}>
                    Modo de edição ativo. A ata foi bloqueada para evitar conflito.
                  </span>
                )}
              </div>

              {!isAtaConfirmed && (
                <div style={{ display: "flex", gap: 8 }}>
                  {!isEditingActions ? (
                    <button
                      onClick={() => {
                        setActionsEditError(null);
                        setIsEditingActions(true);
                      }}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 8,
                        border: `1px solid ${C.orange}`,
                        background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        color: C.white,
                        transition: "all 0.2s",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: `0 2px 8px rgba(255,145,20,0.3)`,
                      }}
                    >
                      <Icon name="note" size={13} color={C.white} />
                      Editar ações
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelActionEditing}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 8,
                          border: `1px solid ${C.creamDark}`,
                          background: C.white,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          color: C.darkMid,
                          transition: "all 0.2s",
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => { void handleSaveActions(); }}
                        disabled={isSaveActionsDisabled}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 8,
                          border: "none",
                          background: isSaveActionsDisabled
                            ? C.creamDark
                            : `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
                          cursor: isSaveActionsDisabled ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          color: isSaveActionsDisabled ? C.grayLight : C.white,
                          transition: "all 0.2s",
                        }}
                      >
                        {isSavingActions ? "Salvando..." : "Salvar ações"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {actionsEditError && (
              <div style={{
                border: "1px solid rgba(224,64,64,0.25)",
                background: "rgba(224,64,64,0.08)",
                color: C.redStop,
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: 12.5,
              }}
              >
                {actionsEditError}
              </div>
            )}

            {editableActions.length === 0 ? (
              <div style={{
                background: C.bg,
                borderRadius: 12,
                border: `1px solid ${C.creamDark}`,
                padding: "24px 18px",
                textAlign: "center",
                color: C.grayLight,
                fontSize: 13.5,
              }}
              >
                Nenhuma ação foi identificada nesta ata.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {editableActions.map((action, index) => (
                  <div
                    key={`action-item-${index}`}
                    style={{
                      background: C.white,
                      borderRadius: 12,
                      border: `1px solid ${C.creamDark}`,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ação {index + 1}
                    </div>

                    {isEditingActions ? (
                      <>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.grayLight, marginBottom: 4 }}>Descrição</div>
                          <textarea
                            value={action.description}
                            onChange={(event) => {
                              const value = event.target.value;
                              setEditableActions((prev) => prev.map((item, itemIndex) => (
                                itemIndex === index ? { ...item, description: value } : item
                              )));
                            }}
                            placeholder="Descreva a ação"
                            style={{ minHeight: 72, resize: "vertical" }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.grayLight, marginBottom: 4 }}>Responsável</div>
                            <select
                              value={action.responsible || ""}
                              onChange={(event) => {
                                const selectedValue = event.target.value;

                                // Extrair email do formato "Nome (email)"
                                const emailMatch = selectedValue.match(/\(([^)]+)\)$/);
                                const email = emailMatch?.[1]?.trim() || selectedValue.trim();

                                // Validar que é um email (contém @)
                                if (!email.includes('@')) {
                                  console.error('Invalid email selected:', selectedValue);
                                  return;
                                }

                                setEditableActions((prev) => prev.map((item, itemIndex) => (
                                  itemIndex === index ? { ...item, responsible: email } : item
                                )));
                              }}
                              required
                              style={{
                                width: "100%",
                                borderRadius: 8,
                                border: `1px solid ${C.creamDark}`,
                                background: C.white,
                                color: C.dark,
                                padding: "10px 12px",
                                fontFamily: "inherit",
                                fontSize: 13,
                                outline: "none",
                              }}
                            >
                              <option value="" disabled>{responsibleOptions.length > 0 ? "Selecione um responsável" : "Adicione participantes"}</option>
                              {responsibleOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.grayLight, marginBottom: 4 }}>Prazo</div>
                            <input
                              type="date"
                              value={toDateInputValue(action.deadline)}
                              onChange={(event) => {
                                const value = event.target.value.trim();
                                setEditableActions((prev) => prev.map((item, itemIndex) => (
                                  itemIndex === index
                                    ? { ...item, deadline: value || undefined }
                                    : item
                                )));
                              }}
                              style={{
                                width: "100%",
                                borderRadius: 8,
                                border: `1px solid ${C.creamDark}`,
                                background: C.white,
                                color: C.dark,
                                padding: "10px 12px",
                                fontFamily: "inherit",
                                fontSize: 13,
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 14.5, color: C.dark, lineHeight: 1.5 }}>
                          <strong>Ação:</strong> {action.description}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                          <div style={{ fontSize: 13, color: C.gray }}>
                            <strong>Responsável:</strong> {action.responsible ? action.responsible : <MissingResponsibleTag size="small" />}
                          </div>
                          <div style={{ fontSize: 13, color: C.gray }}>
                            <strong>Prazo:</strong> {action.deadline ? formatDateToBrDate(action.deadline) : "Sem prazo"}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

