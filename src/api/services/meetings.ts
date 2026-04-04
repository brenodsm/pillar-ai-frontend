import { deleteJson, getJson, patchJson, postJson } from "../client";
import { API_ROUTES } from "../config";
import type { MeetingListItemResponse, MeetingResponse, ParticipantResponse } from "../types/swagger";

export function listMeetings(): Promise<MeetingListItemResponse[]> {
  return getJson<MeetingListItemResponse[]>(API_ROUTES.meetings.list);
}

export function createMeetingFromCalendarEvent(calendarEventId: string): Promise<MeetingResponse> {
  return postJson<MeetingResponse>(API_ROUTES.meetings.create, { calendarEventId });
}

export function createManualMeeting(title: string, scheduledAt?: string): Promise<MeetingResponse> {
  return postJson<MeetingResponse>(API_ROUTES.meetings.create, {
    title,
    ...(scheduledAt ? { scheduledAt } : {}),
  });
}

export function getMeetingById(meetingId: string): Promise<MeetingResponse> {
  return getJson<MeetingResponse>(API_ROUTES.meetings.get(meetingId));
}

export function updateMeetingTitle(meetingId: string, title: string): Promise<MeetingResponse> {
  return patchJson<MeetingResponse>(API_ROUTES.meetings.updateTitle(meetingId), { title });
}

export function addMeetingParticipant(meetingId: string, email: string): Promise<ParticipantResponse> {
  return postJson<ParticipantResponse>(API_ROUTES.meetings.addParticipant(meetingId), { email });
}

export function removeMeetingParticipant(meetingId: string, participantId: string): Promise<void> {
  return deleteJson<void>(API_ROUTES.meetings.removeParticipant(meetingId, participantId));
}

export function startMeetingRecording(meetingId: string): Promise<MeetingResponse> {
  return postJson<MeetingResponse>(API_ROUTES.meetings.startRecording(meetingId), {});
}
