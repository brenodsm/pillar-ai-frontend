export type ActionStatus = "pending" | "in_progress" | "done" | "canceled" | "late";
export type ActionPriority = "low" | "medium" | "high" | "critical";
export type ActionType = "task" | "decision" | "approval";

export interface Action {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: ActionStatus;
  effective_status: ActionStatus;
  progress: number;
  priority: ActionPriority;
  category: string;
  action_type: ActionType;
  meeting_id: string | null;
  meeting_date: string | null;
  meeting_title: string | null;
  parent_id: string | null;
  responsible_email: string;
  participant_emails: string[];
  reminders: number[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActionRequest {
  title: string;
  description?: string;
  deadline?: string;
  priority: ActionPriority;
  action_type: ActionType;
  category?: string;
  responsible_email: string;
  participant_emails?: string[];
  meeting_id?: string;
  minutes_id?: string;
  meeting_date?: string;
  parent_id?: string;
  reminders?: number[];
}

export interface UpdateActionRequest {
  title?: string;
  description?: string;
  deadline?: string;
  status?: ActionStatus;
  progress?: number;
  priority?: ActionPriority;
  category?: string;
  action_type?: ActionType;
  responsible_email?: string;
  participant_emails?: string[];
}

export interface ActionHistory {
  id: string;
  action_id: string;
  changed_by: string;
  field: string;
  old_value: string;
  new_value: string;
  changed_at: string;
}

export interface ActionComment {
  id: string;
  action_id: string;
  parent_comment_id: string | null;
  author_email: string;
  content: string;
  replies?: ActionComment[];
  created_at: string;
}

export interface ActionAttachment {
  id: string;
  action_id: string;
  file_name: string;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ActionReminder {
  id: string;
  action_id: string;
  days_before: number;
  sent_at: string | null;
}
