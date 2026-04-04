import { getJson, putJson } from "../client";
import { API_ROUTES } from "../config";
import type { NoteResponse } from "../types/swagger";

export function getMeetingNote(meetingId: string): Promise<NoteResponse> {
  return getJson<NoteResponse>(API_ROUTES.notes.get(meetingId));
}

export function upsertMeetingNote(meetingId: string, content: string): Promise<NoteResponse> {
  return putJson<NoteResponse>(API_ROUTES.notes.upsert(meetingId), { content });
}
