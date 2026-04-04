import { useState, useEffect, useCallback } from "react";
import { C } from "../constants/colors";
import { Icon } from "./Icon";
import { useAppServices } from "../services";
import type {
  Action,
  ActionAttachment,
  ActionComment,
  ActionHistory,
  ActionReminder,
  ActionStatus,
} from "../domain/actions";

interface ActionDetailModalProps {
  action: Action;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: ActionStatus) => void;
}

type TabId = "detalhes" | "comentarios" | "anexos" | "lembretes" | "historico";

const TABS: { id: TabId; label: string }[] = [
  { id: "detalhes", label: "Detalhes" },
  { id: "comentarios", label: "Comentários" },
  { id: "anexos", label: "Anexos" },
  { id: "lembretes", label: "Lembretes" },
  { id: "historico", label: "Histórico" },
];

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const priorityLabel: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const actionTypeLabel: Record<string, string> = {
  task: "Tarefa",
  decision: "Decisão",
  approval: "Aprovação",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  done: "Concluído",
  canceled: "Cancelado",
  late: "Atrasado",
};

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FFF3CD", color: "#92400E" },
  in_progress: { bg: "#DBEAFE", color: "#1D4ED8" },
  done: { bg: "#D1FAE5", color: "#065F46" },
  canceled: { bg: C.creamDark, color: C.gray },
  late: { bg: "#FEE2E2", color: "#991B1B" },
};

function LoadingState() {
  return (
    <div style={{ padding: "32px 0", textAlign: "center", color: C.grayLight, fontSize: 14 }}>
      Carregando…
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: 16, background: "#FEF2F2", color: C.redStop, borderRadius: 8, fontSize: 14 }}>
      {message}
    </div>
  );
}

// ── Tab: Detalhes ──────────────────────────────────────────────────────────────
function DetalhesTab({ action, onStatusChange }: { action: Action; onStatusChange: (id: string, s: ActionStatus) => void }) {
  const statusStyle = statusColors[action.effective_status] ?? statusColors[action.status] ?? { bg: C.creamDark, color: C.gray };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Title */}
      <Row label="Título">{action.title}</Row>

      {/* Description */}
      {action.description && (
        <Row label="Descrição">
          <span style={{ fontWeight: 400, lineHeight: 1.5 }}>{action.description}</span>
        </Row>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Deadline */}
        <Row label="Prazo">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="calendar" size={14} color={C.orange} />
            {formatDate(action.deadline)}
          </span>
        </Row>

        {/* Priority */}
        <Row label="Prioridade">{priorityLabel[action.priority] ?? action.priority}</Row>

        {/* Action Type */}
        <Row label="Tipo">{actionTypeLabel[action.action_type] ?? action.action_type}</Row>

        {/* Status */}
        <Row label="Status">
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "3px 10px", borderRadius: 12, fontSize: 12,
            fontWeight: 600, background: statusStyle.bg, color: statusStyle.color,
          }}>
            {statusLabel[action.effective_status] ?? statusLabel[action.status] ?? action.status}
          </span>
        </Row>
      </div>

      {/* Progress */}
      <Row label="Progresso">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: C.creamDark, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${action.progress}%`, background: C.orange, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.gray, minWidth: 32, textAlign: "right" }}>
            {action.progress}%
          </span>
        </div>
      </Row>

      {/* Responsible */}
      <Row label="Responsável">
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="users" size={14} color={C.orange} />
          {action.responsible_email}
        </span>
      </Row>

      <div style={{ height: 1, background: C.creamDark }} />

      {/* Status Change Buttons */}
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
  );
}

// ── Tab: Comentários ───────────────────────────────────────────────────────────
function ComentariosTab({ actionId }: { actionId: string }) {
  const { actions: actionsService } = useAppServices();
  const [comments, setComments] = useState<ActionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    actionsService.getActionComments(actionId)
      .then((data) => { if (!cancelled) setComments(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar comentários"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actionId, actionsService]);

  const handleSubmit = async () => {
    const text = newComment.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const created = await actionsService.createActionComment(actionId, text);
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: ActionComment; isReply?: boolean }) => (
    <div style={{
      background: isReply ? C.bg : C.white,
      border: `1px solid ${C.creamDark}`,
      borderRadius: 8,
      padding: "12px 14px",
      marginLeft: isReply ? 20 : 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{comment.author_email}</span>
        <span style={{ fontSize: 11, color: C.grayLight }}>{formatDateTime(comment.created_at)}</span>
      </div>
      <div style={{ fontSize: 14, color: C.gray, lineHeight: 1.5 }}>{comment.content}</div>
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} isReply />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <ErrorState message={error} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {comments.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13 }}>
            Nenhum comentário ainda.
          </div>
        )}
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
      </div>

      {/* New Comment Input */}
      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${C.creamDark}`, paddingTop: 16 }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={2}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.creamDark}`,
            fontSize: 13, color: C.dark, background: C.white, resize: "vertical",
            fontFamily: "inherit", outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          style={{
            padding: "0 16px", borderRadius: 8, background: C.orange, border: "none",
            cursor: submitting || !newComment.trim() ? "not-allowed" : "pointer",
            opacity: submitting || !newComment.trim() ? 0.6 : 1,
            color: C.white, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="send" size={16} color={C.white} />
        </button>
      </div>
    </div>
  );
}

// ── Tab: Anexos ────────────────────────────────────────────────────────────────
function AnexosTab({ actionId }: { actionId: string }) {
  const { actions: actionsService } = useAppServices();
  const [attachments, setAttachments] = useState<ActionAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    actionsService.fetchActionAttachments(actionId)
      .then((data) => { if (!cancelled) setAttachments(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar anexos"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actionId, actionsService]);

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && <ErrorState message={error} />}
      {attachments.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13 }}>
          Nenhum anexo encontrado.
        </div>
      )}
      {attachments.map((att) => (
        <div key={att.id} style={{
          display: "flex", alignItems: "center", gap: 12,
          background: C.white, border: `1px solid ${C.creamDark}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "rgba(255,145,20,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="paperclip" size={16} color={C.orange} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {att.file_name}
            </div>
            <div style={{ fontSize: 11, color: C.grayLight, marginTop: 2 }}>
              {att.uploaded_by} · {formatDateTime(att.uploaded_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Lembretes ─────────────────────────────────────────────────────────────
function LembretesTab({ actionId }: { actionId: string }) {
  const { actions: actionsService } = useAppServices();
  const [reminders, setReminders] = useState<ActionReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    actionsService.fetchActionReminders(actionId)
      .then((data) => { if (!cancelled) setReminders(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar lembretes"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actionId, actionsService]);

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && <ErrorState message={error} />}
      {reminders.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13 }}>
          Nenhum lembrete configurado.
        </div>
      )}
      {reminders.map((r) => (
        <div key={r.id} style={{
          display: "flex", alignItems: "center", gap: 12,
          background: C.white, border: `1px solid ${C.creamDark}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "rgba(255,145,20,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="clock" size={16} color={C.orange} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>
              {r.days_before} {r.days_before === 1 ? "dia" : "dias"} antes
            </div>
            <div style={{ fontSize: 12, color: r.sent_at ? C.green : C.grayLight, marginTop: 2 }}>
              {r.sent_at ? `Enviado em ${formatDateTime(r.sent_at)}` : "Pendente"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Histórico ─────────────────────────────────────────────────────────────
function HistoricoTab({ actionId }: { actionId: string }) {
  const { actions: actionsService } = useAppServices();
  const [history, setHistory] = useState<ActionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    actionsService.getActionHistory(actionId)
      .then((data) => { if (!cancelled) setHistory(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar histórico"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actionId, actionsService]);

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && <ErrorState message={error} />}
      {history.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13 }}>
          Nenhuma alteração registrada.
        </div>
      )}
      {history.map((h) => (
        <div key={h.id} style={{
          background: C.white, border: `1px solid ${C.creamDark}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: C.dark,
              background: C.cream, padding: "2px 8px", borderRadius: 6,
            }}>
              {h.field}
            </span>
            <span style={{ fontSize: 11, color: C.grayLight }}>{formatDateTime(h.changed_at)}</span>
          </div>
          <div style={{ fontSize: 13, color: C.gray, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: C.redStop, textDecoration: "line-through" }}>{h.old_value || "—"}</span>
            <Icon name="chevron" size={14} color={C.grayLight} />
            <span style={{ color: C.green, fontWeight: 500 }}>{h.new_value || "—"}</span>
          </div>
          <div style={{ fontSize: 11, color: C.grayLight, marginTop: 6 }}>
            por {h.changed_by}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ActionDetailModal({ action, onClose, onStatusChange }: ActionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("detalhes");
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(new Set(["detalhes"]));

  const handleTabClick = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setLoadedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 800,
          maxHeight: "80vh",
          background: C.white, borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: C.dark,
            letterSpacing: "-0.02em", lineHeight: 1.3,
            flex: 1, marginRight: 16, margin: 0,
          }}>
            {action.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}
          >
            <Icon name="x" size={20} color={C.grayLight} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, padding: "16px 24px 0",
          borderBottom: `1px solid ${C.creamDark}`,
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "8px 14px",
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? C.orange : C.gray,
                  borderBottom: isActive ? `2px solid ${C.orange}` : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
          {activeTab === "detalhes" && (
            <DetalhesTab action={action} onStatusChange={onStatusChange} />
          )}
          {activeTab === "comentarios" && loadedTabs.has("comentarios") && (
            <ComentariosTab actionId={action.id} />
          )}
          {activeTab === "anexos" && loadedTabs.has("anexos") && (
            <AnexosTab actionId={action.id} />
          )}
          {activeTab === "lembretes" && loadedTabs.has("lembretes") && (
            <LembretesTab actionId={action.id} />
          )}
          {activeTab === "historico" && loadedTabs.has("historico") && (
            <HistoricoTab actionId={action.id} />
          )}
        </div>
      </div>
    </div>
  );
}
