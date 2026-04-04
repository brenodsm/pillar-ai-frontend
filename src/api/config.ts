const API_VERSION_PREFIX = "/api/v1";
const DEFAULT_BACKEND_PORT = "8000";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveDynamicBackendUrl(): string {
  const backendPort = import.meta.env.VITE_BACKEND_PORT?.trim() || DEFAULT_BACKEND_PORT;

  if (typeof window === "undefined") {
    return `http://localhost:${backendPort}`;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname;
  const needsPort = backendPort !== "80" && backendPort !== "443";

  return `${protocol}//${host}${needsPort ? `:${backendPort}` : ""}`;
}

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
const legacyApiUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackUrl = resolveDynamicBackendUrl();
const normalizedConfiguredUrl = trimTrailingSlash(configuredBackendUrl || legacyApiUrl || fallbackUrl);

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
