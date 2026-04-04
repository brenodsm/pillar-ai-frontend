import { API_URL } from "./config";
import type { ApiEnvelope, ApiErrorResponse } from "../types/api";
import { supabase } from "../lib/supabase";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

async function parseResponseBody<T>(response: Response): Promise<T | ApiErrorResponse | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T | ApiErrorResponse;
  } catch {
    return null;
  }
}

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return "data" in payload;
}

function isApiErrorPayload(payload: unknown): payload is ApiErrorResponse {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return (payload as { status?: unknown }).status === "error";
}

async function getAuthHeaders(headers?: HeadersInit): Promise<Headers> {
  const resolvedHeaders = new Headers(headers);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new ApiError(error.message || "Nao foi possivel recuperar a sessao ativa.", 401);
  }

  if (!session?.access_token) {
    throw new ApiError("Usuario nao autenticado", 401);
  }

  resolvedHeaders.set("Authorization", `Bearer ${session.access_token}`);
  return resolvedHeaders;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders(init?.headers);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  const payload = await parseResponseBody<unknown>(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : null;
    const retryAfter = response.headers.get("Retry-After");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");
    const errorDetails =
      errorPayload?.details && typeof errorPayload.details === "object"
        ? errorPayload.details
        : {};

    throw new ApiError(errorPayload?.error || response.statusText || "Erro na requisicao", response.status, {
      ...errorDetails,
      ...(retryAfter ? { retryAfter } : {}),
      ...(rateLimitReset ? { rateLimitReset } : {}),
    });
  }

  if (payload === null) {
    throw new ApiError("Resposta vazia da API", response.status);
  }

  if (isApiEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

export function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function postJson<T, TBody = unknown>(path: string, body: TBody): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function patchJson<T, TBody = unknown>(path: string, body: TBody): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function putJson<T, TBody = unknown>(path: string, body: TBody): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export function postFormData<T>(path: string, body: FormData): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body,
  });
}
