export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiErrorPayload {
  status: "error";
  error: string;
  details?: unknown;
}

export type MeetingStatus = "pending" | "recording" | "processing" | "done";
export type MinutesStatus = "draft" | "confirmed";
export type ActionStatus = "pending" | "in_progress" | "done";

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  azure_id: string;
  created_at: string;
}

export interface CalendarEventDateTime {
  dateTime: string;
  timeZone: string;
}

export interface CalendarPerson {
  name: string;
  email: string;
}

export interface CalendarAttendee extends CalendarPerson {
  status: "none" | "organizer" | "tentativelyAccepted" | "accepted" | "declined" | "notResponded";
  type: "required" | "optional" | "resource";
}

export interface CalendarEventResponse {
  id: string;
  subject: string;
  location: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  organizer: CalendarPerson;
  attendees: CalendarAttendee[];
  isOnlineMeeting?: boolean;
  joinUrl?: string;
}

export interface ParticipantResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  source: "calendar" | "manual" | "organizer";
}

export interface MeetingResponse {
  id: string;
  title: string;
  calendarEventId?: string;
  scheduledAt?: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
  participants: ParticipantResponse[];
}

export interface MeetingListItemResponse {
  id: string;
  title: string;
  calendarEventId?: string;
  scheduledAt?: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionResponse {
  meetingId: string;
  transcription: string;
}

export interface UploadTranscriptionResponse {
  meetingId: string;
  message: string;
  status: "processing";
}

export interface MinutesParticipant {
  name: string;
  email: string;
}

export interface MinutesAction {
  description: string;
  due_date?: string;
  responsible_id?: string;
}

export interface MinutesContent {
  title: string;
  summary: string;
  topics: string[];
  participants: MinutesParticipant[];
  actions: MinutesAction[];
  generated_at?: string;
}

export interface MinutesResponse {
  id: string;
  meetingId: string;
  status: MinutesStatus;
  content: MinutesContent;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteResponse {
  id: string;
  meeting_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DistributionResponse {
  id: string;
  meetingId: string;
  minutesId: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
  sentAt: string;
}

export interface ActionMeetingResponse {
  id: string;
  title: string;
}

export interface ActionResponsibleResponse {
  id: string;
  name: string;
  email: string;
}

export interface ActionResponse {
  id: string;
  description: string;
  status: ActionStatus;
  dueDate?: string;
  meetingId: string;
  minutesId: string;
  meeting?: ActionMeetingResponse;
  responsible?: ActionResponsibleResponse;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListActionsData {
  actions: ActionResponse[];
  total: number;
  limit: number;
  offset: number;
}
