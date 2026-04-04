import type { Action } from "../../domain/actions";
import type { ActionResponse } from "../types/swagger";

function getProgressByStatus(status: Action["status"]): number {
  if (status === "done") return 100;
  if (status === "in_progress") return 50;
  return 0;
}

export function fromSwaggerAction(action: ActionResponse): Action {
  return {
    id: action.id,
    title: action.description,
    description: action.description,
    deadline: action.dueDate ?? null,
    status: action.status,
    effective_status: action.status,
    progress: getProgressByStatus(action.status),
    priority: "medium",
    category: "meeting",
    action_type: "task",
    meeting_id: action.meetingId ?? null,
    meeting_date: null,
    meeting_title: action.meeting?.title ?? null,
    parent_id: null,
    responsible_email: action.responsible?.email ?? "",
    participant_emails: [],
    reminders: [],
    created_by: action.responsible?.email ?? "",
    created_at: action.createdAt,
    updated_at: action.updatedAt,
  };
}
