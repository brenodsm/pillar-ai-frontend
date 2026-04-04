import { C } from "../constants/colors";
import { Icon } from "./Icon";
import type { Action, ActionStatus } from "../domain/actions";
import { formatDateToBrDate } from "../utils/dateFormat";

interface ActionDetailModalProps {
  action: Action;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: ActionStatus) => void;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return formatDateToBrDate(iso);
};

const statusLabel: Record<ActionStatus, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  done: "Concluído",
};

const statusColors: Record<ActionStatus, { bg: string; color: string }> = {
  pending: { bg: "#FFF3CD", color: "#92400E" },
  in_progress: { bg: "#DBEAFE", color: "#1D4ED8" },
  done: { bg: "#D1FAE5", color: "#065F46" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

export function ActionDetailModal({ action, onClose, onStatusChange }: ActionDetailModalProps) {
  const style = statusColors[action.status];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 92vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.creamDark}`,
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: C.dark }}>Detalhes da Ação</h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
            aria-label="Fechar"
          >
            <Icon name="x" size={18} color={C.gray} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Row label="Título">{action.title}</Row>
          {action.description && <Row label="Descrição">{action.description}</Row>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Row label="Prazo">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="calendar" size={14} color={C.orange} />
                {formatDate(action.deadline)}
              </span>
            </Row>
            <Row label="Reunião">{action.meeting_title ?? "—"}</Row>
            <Row label="Responsável">{action.responsible_email || "—"}</Row>
            <Row label="Status">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: style.bg,
                  color: style.color,
                }}
              >
                {statusLabel[action.status]}
              </span>
            </Row>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Alterar Status
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {action.status !== "pending" && (
                <button
                  onClick={() => onStatusChange(action.id, "pending")}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, background: C.cream, border: `1px solid ${C.creamDark}`, cursor: "pointer", color: C.gray, fontWeight: 500 }}
                >
                  Mover p/ Pendente
                </button>
              )}
              {action.status !== "in_progress" && (
                <button
                  onClick={() => onStatusChange(action.id, "in_progress")}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, background: "#DBEAFE", border: "none", cursor: "pointer", color: "#1D4ED8", fontWeight: 500 }}
                >
                  Em Progresso
                </button>
              )}
              {action.status !== "done" && (
                <button
                  onClick={() => onStatusChange(action.id, "done")}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, background: "#D1FAE5", border: "none", cursor: "pointer", color: "#065F46", fontWeight: 500 }}
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
