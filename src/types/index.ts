export type AppState = "idle" | "recording" | "processing" | "finished";

export interface Minutes {
  title: string;
  date: string;
  participants: string[];
  summary: string;
  topics: { title: string; discussion: string }[];
  action_items: {
    description: string;
    responsible: string;
    deadline?: string;
  }[];
  decisions: string[];
  next_steps: string;
}

export interface ProcessResult {
  transcription: {
    text: string;
    language: string;
    segments: { start: number; end: number; text: string }[];
  };
  minutes: Minutes;
  meeting_id?: string | null;
  minutes_id?: string | null;
}

export interface StoredMeeting {
  id: number;
  title: string;
  date: string;
  duration: string;
  participants: number;
  hasAta: boolean;
  result: ProcessResult;
  editedAtaText?: string;
  notes?: string;
  isConfirmed?: boolean;
}

export interface Participant {
  name: string;
  email: string;
  isOwner: boolean;
}

// ── Session / Calendar ────────────────────────────────────────────────────────

export interface SessionUser {
  email: string;
  display_name: string;
}

export interface CalendarMeeting {
  id: string;
  subject: string;
  location: string;
  start: string; // ISO 8601, timezone America/Sao_Paulo
  end: string;
  organizer: { name: string; email: string };
  attendees: { name: string; email: string }[];
}

export interface SessionState {
  user: SessionUser | null;
  meetings: CalendarMeeting[];
}

export interface PendingAction {
  id: string;
  title: string;
  responsibleEmail: string;
  rawResponsible: string;
  deadline: string;
}
