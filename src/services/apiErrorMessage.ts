import { isApiError } from "./errors";

function readRetryAfterSeconds(details: unknown): number | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const retryAfter = (details as { retryAfter?: unknown }).retryAfter;
  if (typeof retryAfter !== "string") {
    return null;
  }

  const parsed = Number.parseInt(retryAfter, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isApiError(error)) {
    if (error.status === 429) {
      const retryAfterSeconds = readRetryAfterSeconds(error.details);
      if (retryAfterSeconds !== null) {
        return `Muitas requisições no momento. Tente novamente em ${retryAfterSeconds}s.`;
      }
      return "Muitas requisições no momento. Tente novamente em instantes.";
    }

    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
