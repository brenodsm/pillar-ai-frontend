export interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  error: string;
  details?: unknown;
}
