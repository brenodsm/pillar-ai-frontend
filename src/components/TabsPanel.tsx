import { useState, useRef } from "react";
import { C } from "../constants/colors";
import { Icon } from "./Icon";
import type { AppState, ProcessResult } from "../types";

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
  onAiRewrite: (instruction: string) => Promise<void>;
  isAiRewriting: boolean;
  isAtaConfirmed: boolean;
  isConfirmingAta: boolean;
  onConfirmAta: () => Promise<void>;
}

export function TabsPanel({ activeTab, setActiveTab, notes, setNotes, appState, result, ataText, setAtaText, transcriptionText, onAiRewrite, isAiRewriting, isAtaConfirmed, isConfirmingAta, onConfirmAta }: TabsPanelProps) {
  const [isEditingAta, setIsEditingAta] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const originalAtaRef = useRef("");
  return (
    <div style={{
      background: C.white, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.creamDark}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      animation: "panelOpen 0.5s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.creamDark}`, padding: "0 8px", background: C.bg }}>
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
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {isEditingAta ? (
                  <>
                    <button
                      onClick={() => {
                        setAtaText(originalAtaRef.current);
                        setIsEditingAta(false);
                      }}
                      style={{
                        padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.creamDark}`,
                        background: C.white, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit", color: C.dark, transition: "all 0.2s",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setIsEditingAta(false)}
                      style={{
                        padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.orange}`,
                        background: C.orange, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit", color: C.white, transition: "all 0.2s",
                      }}
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    {!isAtaConfirmed && (
                      <button
                        onClick={() => {
                          originalAtaRef.current = ataText;
                          setIsEditingAta(true);
                        }}
                        style={{
                          padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.creamDark}`,
                          background: C.white, cursor: "pointer", fontSize: 12, fontWeight: 600,
                          fontFamily: "inherit", color: C.dark, transition: "all 0.2s",
                        }}
                      >
                        Editar
                      </button>
                    )}
                    {!isAtaConfirmed && (
                      <button
                        onClick={() => {
                          setShowAiInput(!showAiInput);
                          setAiInstruction("");
                        }}
                        disabled={isAiRewriting}
                        style={{
                          padding: "7px 16px", borderRadius: 8,
                          border: `1px solid ${C.orange}`,
                          background: showAiInput ? C.orange : `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
                          cursor: isAiRewriting ? "not-allowed" : "pointer",
                          fontSize: 12, fontWeight: 600,
                          fontFamily: "inherit",
                          color: C.white,
                          transition: "all 0.2s",
                          display: "inline-flex", alignItems: "center", gap: 6,
                          boxShadow: `0 2px 8px rgba(255,145,20,0.3)`,
                        }}
                      >
                        <Icon name="sparkles" size={14} color={C.white} />
                        Editar com AI
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
                  </>
                )}
              </div>
            </div>

            {/* AI Edit Input */}
            {showAiInput && !isEditingAta && (
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
            <div style={{ background: C.bg, borderRadius: 12, padding: "28px 32px", border: `1px solid ${isEditingAta ? C.orange : C.creamDark}`, transition: "border-color 0.2s" }}>
              {isEditingAta ? (
                <textarea
                  value={ataText}
                  onChange={(e) => setAtaText(e.target.value)}
                  style={{
                    width: "100%", minHeight: 400, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13.5, lineHeight: 1.85, color: C.dark, background: "transparent",
                    border: "none", outline: "none", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              ) : (
                <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.85, color: C.dark, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {ataText}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
