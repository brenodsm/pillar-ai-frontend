import { getJson, patchJson } from "../client";
import { API_ROUTES } from "../config";
import { fromSwaggerAction } from "../mappers/actionMapper";
import type { Action, ActionStatus } from "../../domain/actions";
import type { ActionResponse, ListActionsData } from "../types/swagger";

export type {
  Action,
  ActionStatus,
} from "../../domain/actions";

interface FetchActionsParams {
  limit?: number;
  offset?: number;
  status?: ActionStatus[];
  meeting_id?: string;
}

function encodeActionsQuery(params?: FetchActionsParams): string {
  const search = new URLSearchParams();

  if (typeof params?.limit === "number") search.set("limit", String(params.limit));
  if (typeof params?.offset === "number") search.set("offset", String(params.offset));
  if (params?.meeting_id) search.set("meeting_id", params.meeting_id);
  if (params?.status && params.status.length > 0) {
    search.set("status", params.status.join(","));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

async function getActionsFromPath(path: string): Promise<ActionResponse[]> {
  const data = await getJson<ListActionsData>(path);
  return data.actions;
}

export async function fetchActionsBoard(params?: FetchActionsParams): Promise<Action[]> {
  const query = encodeActionsQuery({ limit: 100, offset: 0, ...params });

  const [assigned, organized] = await Promise.all([
    getActionsFromPath(`${API_ROUTES.actions.assigned}${query}`),
    getActionsFromPath(`${API_ROUTES.actions.organized}${query}`),
  ]);

  const byId = new Map<string, ActionResponse>();
  for (const item of [...assigned, ...organized]) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).map(fromSwaggerAction);
}

export async function updateActionStatus(id: string, status: ActionStatus): Promise<Action> {
  const response = await patchJson<ActionResponse>(API_ROUTES.actions.updateStatus(id), { status });
  return fromSwaggerAction(response);
}
