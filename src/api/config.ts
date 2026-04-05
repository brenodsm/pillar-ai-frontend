const API_VERSION_PREFIX = "/api/v1";
const REQUIRED_BACKEND_URL_ENV = "VITE_BACKEND_URL";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function logApiConfigError(event: string, details: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.error({
    scope: "api_config",
    level: "error",
    event,
    ...details,
  });
}

function resolveConfiguredBackendUrl(): string {
  const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

  if (!configuredBackendUrl) {
    logApiConfigError("missing_required_backend_url", {
      requiredEnv: REQUIRED_BACKEND_URL_ENV,
      hasLegacyApiUrl: Boolean(import.meta.env.VITE_API_URL?.trim()),
    });

    throw new Error(`Missing required environment variable: ${REQUIRED_BACKEND_URL_ENV}`);
  }

  return configuredBackendUrl;
}

const configuredBackendUrl = resolveConfiguredBackendUrl();
const normalizedConfiguredUrl = trimTrailingSlash(configuredBackendUrl);

const apiBaseUrl = normalizedConfiguredUrl.endsWith(API_VERSION_PREFIX)
  ? normalizedConfiguredUrl.slice(0, -API_VERSION_PREFIX.length)
  : normalizedConfiguredUrl;

export const API_URL = `${apiBaseUrl}${API_VERSION_PREFIX}`;

export const API_ROUTES = {
  users: {
    me: "/me",
  },
  calendar: {
    events: "/calendar/events",
  },
  meetings: {
    list: "/meetings",
    create: "/meetings",
    get: (id: string) => `/meetings/${id}`,
    updateTitle: (id: string) => `/meetings/${id}`,
    addParticipant: (id: string) => `/meetings/${id}/participants`,
    removeParticipant: (id: string, participantId: string) => `/meetings/${id}/participants/${participantId}`,
    startRecording: (id: string) => `/meetings/${id}/recording/start`,
  },
  transcription: {
    upload: (id: string) => `/meetings/${id}/transcription`,
    get: (id: string) => `/meetings/${id}/transcription`,
  },
  minutes: {
    get: (id: string) => `/meetings/${id}/minutes`,
    edit: (id: string) => `/meetings/${id}/minutes`,
    confirm: (id: string) => `/meetings/${id}/minutes/confirm`,
    distribute: (id: string) => `/meetings/${id}/minutes/distribute`,
  },
  notes: {
    get: (id: string) => `/meetings/${id}/notes`,
    upsert: (id: string) => `/meetings/${id}/notes`,
  },
  actions: {
    assigned: "/actions/assigned",
    organized: "/actions/organized",
    updateStatus: (id: string) => `/actions/${id}/status`,
  },
} as const;
