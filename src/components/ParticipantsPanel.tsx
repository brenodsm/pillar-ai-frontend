import { C } from "../constants/colors";
import { Icon } from "./Icon";
import type { Participant } from "../types";

interface ParticipantsPanelProps {
  participants: Participant[];
  emailInput: string;
  emailSent: boolean;
  isSending: boolean;
  sendError: string | null;
  setEmailInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (email: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  isAtaConfirmed: boolean;
}

export function ParticipantsPanel({
  participants, emailInput, emailSent, isSending, sendError,
  setEmailInput, onAdd, onRemove, onKeyDown, onSend, isAtaConfirmed,
}: ParticipantsPanelProps) {
  const emailValid = emailInput.trim() !== "" && emailInput.includes("@");

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: "24px 28px",
      border: `1px solid ${C.creamDark}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      marginTop: 24,
      animation: "panelOpen 0.5s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,145,20,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="users" size={18} color={C.orange} />
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Participantes</span>
            <div style={{ fontSize: 12, color: C.grayLight, marginTop: 1 }}>
              Reenvio de ata confirmada para os participantes
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.grayLight, background: C.bg, padding: "4px 10px", borderRadius: 6 }}>
          {participants.length} {participants.length === 1 ? "pessoa" : "pessoas"}
        </span>
      </div>

      {/* Email Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          padding: "0 14px", height: 44,
          background: C.bg, borderRadius: 10,
          border: `1.5px solid ${C.creamDark}`,
          transition: "all 0.2s ease",
        }}>
          <Icon name="mail" size={16} color={C.grayLighter} />
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Digite o e-mail do participante..."
            style={{
              border: "none", outline: "none", background: "transparent", flex: 1,
              fontFamily: "inherit", fontSize: 13.5, color: C.dark,
            }}
          />
        </div>
        <button
          onClick={onAdd}
          style={{
            width: 44, height: 44, borderRadius: 10, border: "none",
            background: emailValid ? `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})` : C.creamDark,
            cursor: emailValid ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease", flexShrink: 0,
          }}
        >
          <Icon name="plus" size={18} color={emailValid ? C.white : C.grayLight} />
        </button>
      </div>

      {/* Participants List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {participants.map((p, i) => (
          <div
            key={p.email}
            style={{
              display: "flex", alignItems: "center", padding: "10px 14px",
              borderRadius: 10, background: C.bg,
              border: `1px solid ${p.isOwner ? "rgba(255,145,20,0.15)" : "transparent"}`,
              animation: `fadeIn 0.3s ease ${i * 50}ms both`,
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: "50%", marginRight: 12, flexShrink: 0,
              background: p.isOwner
                ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                : `linear-gradient(135deg, ${C.grayLight}, ${C.grayLighter})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.white, fontSize: 12, fontWeight: 700,
            }}>
              {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>{p.name}</span>
                {p.isOwner && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: C.orange,
                    background: "rgba(255,145,20,0.1)", padding: "2px 7px", borderRadius: 5,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>Organizador</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.grayLight, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.email}
              </div>
            </div>
            {!p.isOwner && (
              <button
                onClick={() => onRemove(p.email)}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: "none",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s ease", flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(224,64,64,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon name="x" size={14} color={C.grayLight} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {sendError && (
        <div style={{
          fontSize: 12.5, color: "#e04040", background: "rgba(224,64,64,0.07)",
          border: "1px solid rgba(224,64,64,0.18)", borderRadius: 8,
          padding: "10px 14px", marginBottom: 14,
        }}>
          {sendError}
        </div>
      )}

      {/* Send Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {isAtaConfirmed ? (
          <span style={{ fontSize: 12, color: C.grayLight }}>
            A ata será enviada em PDF por e-mail
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: C.orange }}>
            Confirme a ata na aba "Ata" para liberar o envio
          </span>
        )}
        <button
          className="btn-primary"
          onClick={onSend}
          disabled={emailSent || isSending || !isAtaConfirmed}
          style={{
            background: emailSent ? C.green : (!isAtaConfirmed ? C.creamDark : `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`),
            color: C.white,
            boxShadow: emailSent ? "0 4px 16px rgba(46,170,92,0.25)" : (!isAtaConfirmed ? "none" : `0 4px 16px rgba(255,145,20,0.25)`),
            fontSize: 13.5, padding: "11px 24px",
            transition: "all 0.3s ease",
            cursor: (emailSent || isSending || !isAtaConfirmed) ? "not-allowed" : "pointer",
            opacity: isSending ? 0.8 : 1,
          }}
        >
          {emailSent ? (
            <><Icon name="check" size={16} color={C.white} />Enviado!</>
          ) : isSending ? (
            <>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: C.white,
                animation: "spin 0.8s linear infinite",
              }} />
              Enviando...
            </>
          ) : (
            <><Icon name="send" size={16} color={C.white} />Enviar para {participants.length} {participants.length === 1 ? "pessoa" : "pessoas"}</>
          )}
        </button>
      </div>
    </div>
  );
}
