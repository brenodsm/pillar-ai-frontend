import { getJson, postFormData } from "../client";
import { API_ROUTES } from "../config";
import type { TranscriptionResponse, UploadTranscriptionResponse } from "../types/swagger";

export async function uploadTranscriptionAudio(meetingId: string, audio: Blob): Promise<UploadTranscriptionResponse> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  return postFormData<UploadTranscriptionResponse>(API_ROUTES.transcription.upload(meetingId), formData);
}

export function getMeetingTranscription(meetingId: string): Promise<TranscriptionResponse> {
  return getJson<TranscriptionResponse>(API_ROUTES.transcription.get(meetingId));
}
