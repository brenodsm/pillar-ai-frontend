import { useCallback, useEffect, useState } from "react";
import { DndContext, DragEndEvent, useDroppable, useDraggable, useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
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

function DroppableColumn({ col, children }: { col: { id: ActionStatus; title: string; color: string }; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} style={{
      flex: 1, minWidth: 300, background: isOver ? "#F3F4F6" : C.cream,
      borderRadius: 12, display: "flex", flexDirection: "column", padding: 16
    }}>
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
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? "default" : "grab",
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const draggedAction = actions.find((item) => item.id === String(active.id));
      if (!draggedAction) {
        return;
      }
      handleStatusChange(String(active.id), over.id as ActionStatus, draggedAction);
    }
  };

  const columns: { id: ActionStatus; title: string; color: string }[] = [
    { id: "pending", title: "Pendentes", color: C.orange },
    { id: "in_progress", title: "Em Andamento", color: "#3B82F6" },
    { id: "done", title: "Concluídos", color: C.green },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Ações</h1>
          <p style={{ margin: "4px 0 0", color: C.grayLight, fontSize: 13 }}>Gerencie as pendências e tarefas geradas.</p>
        </div>
        <button
          onClick={loadActions}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
            background: C.white, border: `1px solid ${C.creamDark}`, borderRadius: 8,
            cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.dark
          }}
        >
          <Icon name="play" size={14} /> Atualizar
        </button>
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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", gap: 24, flex: 1, overflowX: "auto", paddingBottom: 16 }}>
            {columns.map(col => {
              const colActions = actions.filter((a) => a.status === col.id);

              return (
                <DroppableColumn key={col.id} col={col}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: col.color, textTransform: "uppercase",
                      letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                      {col.title}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.grayLight, background: C.creamDark, padding: "2px 8px", borderRadius: 12 }}>
                      {colActions.length}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto" }}>
                    {colActions.map(action => (
                      <DraggableCard
                        key={action.id}
                        action={action}
                        disabled={!isActionOwnedByUser(action, userEmail)}
                      >
                        <div
                          onClick={() => setSelectedAction(action)}
                          style={{
                            background: C.white, padding: 16, borderRadius: 10,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                            border: `1px solid ${C.creamDark}`,
                            display: "flex", flexDirection: "column", gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{action.title}</div>
                          {action.meeting_title && (
                            <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.4 }}>
                              Reunião: {action.meeting_title}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                            <div style={{ fontSize: 11, color: C.grayLight, display: "flex", alignItems: "center", gap: 4 }}>
                              <Icon name="calendar" size={12} />
                              {action.deadline ? formatDateToBrDate(action.deadline) : "Sem prazo"}
                            </div>
                            <div style={{ fontSize: 11, color: C.grayLight, display: "flex", alignItems: "center", gap: 4 }}>
                              <Icon name="users" size={12} />
                              {action.responsible_email}
                            </div>
                          </div>

                          <div
                            onClick={e => e.stopPropagation()}
                            style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}
                          >
                            {!isActionOwnedByUser(action, userEmail) ? (
                              <span style={{ fontSize: 11, color: C.grayLighter, fontWeight: 600 }}>
                                Somente responsável
                              </span>
                            ) : null}
                            {col.id !== "pending" && isActionOwnedByUser(action, userEmail) && (
                              <button
                                onClick={e => { e.stopPropagation(); handleStatusChange(action.id, "pending", action); }}
                                style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: C.cream, border: "none", cursor: "pointer", color: C.gray }}>
                                Mover p/ Pendente
                              </button>
                            )}
                            {col.id !== "in_progress" && isActionOwnedByUser(action, userEmail) && (
                              <button
                                onClick={e => { e.stopPropagation(); handleStatusChange(action.id, "in_progress", action); }}
                                style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "#DBEAFE", border: "none", cursor: "pointer", color: "#1D4ED8" }}>
                                Em Progresso
                              </button>
                            )}
                            {col.id !== "done" && isActionOwnedByUser(action, userEmail) && (
                              <button
                                onClick={e => { e.stopPropagation(); handleStatusChange(action.id, "done", action); }}
                                style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "#D1FAE5", border: "none", cursor: "pointer", color: "#065F46" }}>
                                Concluir
                              </button>
                            )}
                          </div>
                        </div>
                      </DraggableCard>
                    ))}
                    {colActions.length === 0 && (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.grayLighter, fontSize: 13 }}>
                        Nenhuma ação aqui.
                      </div>
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>
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
