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
  meetings: {
    process: "/meetings/process",
    rewrite: "/meetings/rewrite",
    sendMinutes: "/meetings/send-minutes",
    extractActions: "/meetings/extract-actions",
  },
  users: {
    resolve: "/users/resolve",
    meetings: (email: string) => `/users/${encodeURIComponent(email)}/meetings`,
  },
  actions: {
    list: "/actions",
    create: "/actions",
    get: (id: string) => `/actions/${id}`,
    update: (id: string) => `/actions/${id}`,
    delete: (id: string) => `/actions/${id}`,
    attachments: (id: string) => `/actions/${id}/attachments`,
    reminders: (id: string) => `/actions/${id}/reminders`,
    history: (id: string) => `/actions/${id}/history`,
    comments: (id: string) => `/actions/${id}/comments`,
  },
} as const;
