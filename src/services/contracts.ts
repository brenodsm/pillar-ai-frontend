import type { CalendarMeeting, ProcessResult, SessionUser } from "../types";
import type { RewriteMeetingRequest, SendMinutesRequest } from "../types/api";
import type {
  Action,
  ActionAttachment,
  ActionComment,
  ActionHistory,
  ActionReminder,
  ActionStatus,
  CreateActionRequest,
  UpdateActionRequest,
} from "../domain/actions";

export interface ExtractedActionItem {
  description: string;
  responsible: string;
  deadline: string;
}

export interface UsersService {
  resolveUser(email: string): Promise<SessionUser>;
  getUserMeetings(email: string): Promise<CalendarMeeting[]>;
}

export interface MeetingsService {
  processMeeting(audio: Blob, template?: string | null, organizerEmail?: string | null): Promise<ProcessResult>;
  rewriteMeeting(payload: RewriteMeetingRequest): Promise<string>;
  sendMinutes(payload: SendMinutesRequest): Promise<void>;
  extractActions(ataText: string): Promise<ExtractedActionItem[]>;
}

export interface ActionsService {
  fetchActions(params?: Record<string, string>): Promise<Action[]>;
  createAction(payload: CreateActionRequest): Promise<Action>;
  updateAction(id: string, payload: UpdateActionRequest): Promise<Action>;
  getActionComments(id: string): Promise<ActionComment[]>;
  createActionComment(id: string, content: string, parentCommentId?: string): Promise<ActionComment>;
  fetchActionAttachments(id: string): Promise<ActionAttachment[]>;
  fetchActionReminders(id: string): Promise<ActionReminder[]>;
  getActionHistory(id: string): Promise<ActionHistory[]>;
  setActionStatus(id: string, status: ActionStatus): Promise<Action>;
}

export interface RuntimeService {
  apiUrl: string;
}

export interface AppServices {
  users: UsersService;
  meetings: MeetingsService;
  actions: ActionsService;
  runtime: RuntimeService;
}
