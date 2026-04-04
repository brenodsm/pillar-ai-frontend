export interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  error: string;
  details?: unknown;
}

export interface RewriteMeetingRequest {
  current_ata: string;
  transcription: string;
  notes: string;
  user_request: string;
  participants: string;
  meeting_title: string;
}

export interface RewriteMeetingResponse {
  ata: string;
}

export interface SendMinutesRequest {
  meeting_title: string;
  ata_text: string;
  participants: string[];
}