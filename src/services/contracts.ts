import type { CalendarMeeting, SessionUser } from "../types";
import type { Action, ActionStatus } from "../domain/actions";
import type {
  DistributionResponse,
  MeetingListItemResponse,
  MeetingResponse,
  MinutesResponse,
  NoteResponse,
  ParticipantResponse,
  TranscriptionResponse,
  UploadTranscriptionResponse,
} from "../api/types/swagger";

export interface UsersService {
  getCurrentUser(): Promise<SessionUser>;
  getCalendarEvents(startDateTime: string, endDateTime: string): Promise<CalendarMeeting[]>;
}

export interface MeetingsService {
  listMeetings(): Promise<MeetingListItemResponse[]>;
  createMeetingFromCalendarEvent(calendarEventId: string): Promise<MeetingResponse>;
  createManualMeeting(title: string, scheduledAt?: string): Promise<MeetingResponse>;
  getMeetingById(meetingId: string): Promise<MeetingResponse>;
  updateMeetingTitle(meetingId: string, title: string): Promise<MeetingResponse>;
  addMeetingParticipant(meetingId: string, email: string): Promise<ParticipantResponse>;
  removeMeetingParticipant(meetingId: string, participantId: string): Promise<void>;
  startMeetingRecording(meetingId: string): Promise<MeetingResponse>;
}

export interface TranscriptionService {
  uploadTranscriptionAudio(meetingId: string, audio: Blob): Promise<UploadTranscriptionResponse>;
  getMeetingTranscription(meetingId: string): Promise<TranscriptionResponse>;
}

export interface MinutesService {
  getMeetingMinutes(meetingId: string): Promise<MinutesResponse>;
  editMeetingMinutes(meetingId: string, instruction: string): Promise<MinutesResponse>;
  confirmMeetingMinutes(meetingId: string): Promise<MinutesResponse>;
  distributeMinutesByEmail(meetingId: string): Promise<DistributionResponse>;
}

export interface NotesService {
  getMeetingNote(meetingId: string): Promise<NoteResponse>;
  upsertMeetingNote(meetingId: string, content: string): Promise<NoteResponse>;
}

export interface ActionsService {
  fetchActionsBoard(params?: {
    limit?: number;
    offset?: number;
    status?: ActionStatus[];
    meeting_id?: string;
  }): Promise<Action[]>;
  updateActionStatus(id: string, status: ActionStatus): Promise<Action>;
}

export interface RuntimeService {
  apiUrl: string;
}

export interface AppServices {
  users: UsersService;
  meetings: MeetingsService;
  transcription: TranscriptionService;
  minutes: MinutesService;
  notes: NotesService;
  actions: ActionsService;
  runtime: RuntimeService;
}
