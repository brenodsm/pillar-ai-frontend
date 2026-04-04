import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { C } from "../constants/colors";
import { Icon } from "../components/Icon";
import { ActionDetailModal } from "../components/ActionDetailModal";
import { useAppServices } from "../services";
import { isApiError } from "../services/errors";
import { getApiErrorMessage } from "../services/apiErrorMessage";
import { formatDateToBrDate } from "../utils/dateFormat";
import type { Action, ActionStatus } from "../domain/actions";

interface ActionsViewProps {
  userEmail?: string;
  refreshToken?: number;
}

interface ColumnDefinition {
  id: ActionStatus;
  title: string;
  accent: string;
  softBg: string;
  pillBg: string;
  pillColor: string;
}

const STATUS_META: Record<ActionStatus, Omit<ColumnDefinition, "id">> = {
  pending: {
    title: "Não iniciada",
    accent: "#777B82",
    softBg: "#F2F2F1",
    pillBg: "#E4E4E2",
    pillColor: "#4B5563",
  },
  in_progress: {
    title: "Em andamento",
    accent: "#3B82F6",
    softBg: "#EAF1FD",
    pillBg: "#D8E6FB",
    pillColor: "#1D4ED8",
  },
  done: {
    title: "Concluído",
    accent: "#2EAA5C",
    softBg: "#EAF6EE",
    pillBg: "#D6EFDE",
    pillColor: "#166534",
  },
};

const COLUMN_ORDER: ActionStatus[] = ["pending", "in_progress", "done"];

function DroppableColumn({
  column,
  count,
  children,
}: {
  column: ColumnDefinition;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 340,
        minWidth: 340,
        background: isOver ? "#E8EEF7" : column.softBg,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        padding: 10,
        border: `1px solid ${isOver ? `${column.accent}66` : "#E3E3E1"}`,
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            background: column.pillBg,
            color: column.pillColor,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: column.accent }} />
          {column.title}
        </div>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>{count}</div>
      </div>

      {children}
    </div>
  );
}

function DraggableCard({ action, disabled, children }: { action: Action; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
    disabled,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.15 : 1,
    cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
    width: "100%",
    maxWidth: 320,
    margin: "0 auto",
    position: "relative" as const,
    zIndex: isDragging ? 12 : 1,
    touchAction: "none" as const,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
    >
      {children}
    </div>
  );
}

function isActionOwnedByUser(action: Action, userEmail?: string): boolean {
  if (!userEmail || !action.responsible_email) {
    return false;
  }

  return action.responsible_email.toLowerCase() === userEmail.toLowerCase();
}

export function ActionsView({ userEmail, refreshToken = 0 }: ActionsViewProps) {
  const { actions: actionsService } = useAppServices();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      void userEmail;
      const data = await actionsService.fetchActionsBoard();
      setActions(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar ações"));
    } finally {
      setLoading(false);
    }
  }, [actionsService, userEmail]);

  useEffect(() => {
    void loadActions();
  }, [loadActions, refreshToken]);

  const handleStatusChange = useCallback(async (id: string, newStatus: ActionStatus, action?: Action) => {
    const targetAction = action ?? actions.find((item) => item.id === id);
    if (!targetAction) {
      return;
    }

    if (!isActionOwnedByUser(targetAction, userEmail)) {
      setError("Apenas o responsável pode atualizar o status desta ação.");
      return;
    }

    try {
      setError(null);
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      await actionsService.updateActionStatus(id, newStatus);
    } catch (err) {
      if (isApiError(err) && err.status === 404) {
        setError("Ação não encontrada ou sem permissão para atualização.");
      } else {
        setError(getApiErrorMessage(err, "Erro ao atualizar status da ação."));
      }
      void loadActions();
    }
  }, [actions, actionsService, loadActions, userEmail]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveActionId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveActionId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveActionId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const draggedAction = actions.find((item) => item.id === String(active.id));
      if (!draggedAction) {
        return;
      }
      handleStatusChange(String(active.id), over.id as ActionStatus, draggedAction);
    }
  };

  const columns: ColumnDefinition[] = useMemo(
    () =>
      COLUMN_ORDER.map((status) => ({
        id: status,
        ...STATUS_META[status],
      })),
    []
  );

  const actionsByStatus = useMemo(() => {
    const grouped: Record<ActionStatus, Action[]> = {
      pending: [],
      in_progress: [],
      done: [],
    };

    const sorted = [...actions].sort((a, b) => {
      const firstDate = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const secondDate = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      if (firstDate !== secondDate) return firstDate - secondDate;
      return a.title.localeCompare(b.title);
    });

    sorted.forEach((action) => grouped[action.status].push(action));
    return grouped;
  }, [actions]);

  const activeAction = useMemo(
    () => (activeActionId ? actions.find((action) => action.id === activeActionId) ?? null : null),
    [actions, activeActionId]
  );

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", background: "#F7F7F5" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid #E8E8E6",
        }}
      >
        <h1 style={{ fontSize: "clamp(26px, 3.8vw, 32px)", fontWeight: 700, margin: 0, letterSpacing: "-0.015em", color: C.dark }}>
          Painel de Ações
        </h1>
      </div>

      {error && (
        <div style={{ padding: 16, background: "#FEF2F2", color: C.redStop, borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: C.grayLight }}>
          Carregando ações…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", gap: 14, flex: 1, overflowX: "auto", paddingBottom: 16, justifyContent: "center" }}>
            {columns.map((column) => {
              const colActions = actionsByStatus[column.id];

              return (
                <DroppableColumn key={column.id} column={column} count={colActions.length}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      overflowY: "auto",
                      overflowX: "hidden",
                      minHeight: 120,
                    }}
                  >
                    {colActions.map((action) => {
                      const actionStatusMeta = STATUS_META[action.status];
                      const actionContext = action.meeting_title || action.description || "Sem contexto adicional";
                      const extraDescription = action.meeting_title && action.description ? action.description : null;
                      const availableStatus = COLUMN_ORDER.filter((status) => status !== action.status);

                      return (
                      <DraggableCard
                        key={action.id}
                        action={action}
                        disabled={!isActionOwnedByUser(action, userEmail)}
                      >
                        <div
                          onClick={() => setSelectedAction(action)}
                          style={{
                            background: C.white,
                            padding: "12px 12px 10px",
                            borderRadius: 10,
                            boxShadow: "0 1px 3px rgba(18,18,18,0.07)",
                            border: "1px solid #E5E5E3",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
                            {action.title}
                          </div>

                          <div style={{ fontSize: 13, color: C.darkMid, lineHeight: 1.35 }}>{actionContext}</div>

                          {extraDescription && (
                            <div
                              style={{
                                fontSize: 12,
                                color: C.gray,
                                lineHeight: 1.4,
                                maxHeight: 34,
                                overflow: "hidden",
                              }}
                            >
                              {extraDescription}
                            </div>
                          )}

                          <div style={{ display: "inline-flex", width: "fit-content", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span
                              style={{
                                borderRadius: 999,
                                padding: "2px 10px",
                                fontSize: 12,
                                fontWeight: 600,
                                background: actionStatusMeta.pillBg,
                                color: actionStatusMeta.pillColor,
                              }}
                            >
                              {actionStatusMeta.title}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: C.grayLight, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <Icon name="calendar" size={12} />
                            {action.deadline ? formatDateToBrDate(action.deadline) : "Sem prazo"}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: C.gray,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              minHeight: 20,
                            }}
                          >
                            <Icon name="users" size={12} />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {action.responsible_email || "Sem responsável"}
                            </span>
                          </div>

                          <div
                            onClick={(event) => event.stopPropagation()}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 6 }}
                          >
                            {!isActionOwnedByUser(action, userEmail) ? (
                              <span style={{ fontSize: 11, color: C.grayLighter, fontWeight: 600 }}>
                                Somente responsável
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: C.grayLight, fontWeight: 500 }}>
                                Arraste ou use os atalhos:
                              </span>
                            )}
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                              {isActionOwnedByUser(action, userEmail) &&
                                availableStatus.map((status) => (
                                  <button
                                    key={status}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleStatusChange(action.id, status, action);
                                    }}
                                    style={{
                                      fontSize: 11,
                                      lineHeight: 1,
                                      padding: "5px 8px",
                                      borderRadius: 999,
                                      border: "none",
                                      cursor: "pointer",
                                      background: STATUS_META[status].pillBg,
                                      color: STATUS_META[status].pillColor,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {STATUS_META[status].title}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </DraggableCard>
                      );
                    })}
                    {colActions.length === 0 && (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13, borderRadius: 8 }}>
                        Nenhuma ação aqui.
                      </div>
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeAction ? (
              <div
                style={{
                  width: 320,
                  background: C.white,
                  padding: "12px 12px 10px",
                  borderRadius: 10,
                  boxShadow: "0 10px 24px rgba(17,24,39,0.22)",
                  border: "1px solid #D5DAE3",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  cursor: "grabbing",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
                  {activeAction.title}
                </div>
                <div style={{ fontSize: 12, color: C.grayLight, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="calendar" size={12} />
                  {activeAction.deadline ? formatDateToBrDate(activeAction.deadline) : "Sem prazo"}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedAction && (
        <ActionDetailModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            setSelectedAction(null);
          }}
        />
      )}
    </div>
  );
}
