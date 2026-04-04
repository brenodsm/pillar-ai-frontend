import { getJson, postJson, patchJson, deleteJson } from "../client";
import { API_ROUTES } from "../config";
import type {
  Action,
  ActionAttachment,
  ActionComment,
  ActionHistory,
  ActionReminder,
  CreateActionRequest,
  UpdateActionRequest,
} from "../../domain/actions";

export type {
  Action,
  ActionAttachment,
  ActionComment,
  ActionHistory,
  ActionPriority,
  ActionReminder,
  ActionStatus,
  ActionType,
  CreateActionRequest,
  UpdateActionRequest,
} from "../../domain/actions";

export async function fetchActions(params?: Record<string, string>): Promise<Action[]> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return getJson<Action[]>(`${API_ROUTES.actions.list}${query}`);
}

export async function createAction(payload: CreateActionRequest): Promise<Action> {
  return postJson<Action>(API_ROUTES.actions.create, payload);
}

export async function getActionDetails(id: string): Promise<Action> {
  return getJson<Action>(API_ROUTES.actions.get(id));
}

export async function updateAction(id: string, payload: UpdateActionRequest): Promise<Action> {
  return patchJson<Action>(API_ROUTES.actions.update(id), payload);
}

export async function deleteAction(id: string): Promise<void> {
  return deleteJson<void>(API_ROUTES.actions.delete(id));
}

export async function getActionHistory(id: string): Promise<ActionHistory[]> {
  return getJson<ActionHistory[]>(API_ROUTES.actions.history(id));
}

export async function fetchActionAttachments(id: string): Promise<ActionAttachment[]> {
  return getJson<ActionAttachment[]>(API_ROUTES.actions.attachments(id));
}

export async function fetchActionReminders(id: string): Promise<ActionReminder[]> {
  return getJson<ActionReminder[]>(API_ROUTES.actions.reminders(id));
}

export async function fetchActionHistory(id: string): Promise<ActionHistory[]> {
  return getJson<ActionHistory[]>(API_ROUTES.actions.history(id));
}

export async function getActionComments(id: string): Promise<ActionComment[]> {
  return getJson<ActionComment[]>(API_ROUTES.actions.comments(id));
}

export async function createActionComment(id: string, content: string, parent_comment_id?: string): Promise<ActionComment> {
  return postJson<ActionComment>(API_ROUTES.actions.comments(id), { content, parent_comment_id });
}
