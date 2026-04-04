import { postFormData, postJson } from "../client";
import { API_ROUTES } from "../config";
import type { ProcessResult } from "../../types";
import type { RewriteMeetingRequest, RewriteMeetingResponse, SendMinutesRequest } from "../../types/api";

export async function processMeeting(audio: Blob, template?: string | null, organizerEmail?: string | null): Promise<ProcessResult> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  if (template) {
    formData.append("template", template);
  }
  if (organizerEmail) {
    formData.append("organizer_email", organizerEmail);
  }

  return postFormData<ProcessResult>(API_ROUTES.meetings.process, formData);
}

export async function rewriteMeeting(payload: RewriteMeetingRequest): Promise<string> {
  const response = await postJson<RewriteMeetingResponse>(API_ROUTES.meetings.rewrite, payload);
  return response.ata;
}

export async function sendMinutes(payload: SendMinutesRequest): Promise<void> {
  await postJson<{ sent: boolean }>(API_ROUTES.meetings.sendMinutes, payload);
}

export async function extractActions(ataText: string): Promise<{ description: string; responsible: string; deadline: string }[]> {
  const res = await postJson<{ action_items: any[] }>(API_ROUTES.meetings.extractActions, { ata_text: ataText });
  return res.action_items || [];
}