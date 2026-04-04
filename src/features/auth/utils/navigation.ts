import { AUTH_CALLBACK_PATH, AUTH_DEFAULT_NEXT_PATH } from "../constants";

function normalizeRedirectUrl(rawValue: string): URL | null {
  try {
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const parsed = new URL(rawValue, currentOrigin);

    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = AUTH_CALLBACK_PATH;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function resolveAuthRedirectTo(nextPath?: string): string {
  const configuredRedirect = import.meta.env.VITE_REDIRECT_URL?.trim();
  const fallbackRedirect =
    typeof window !== "undefined"
      ? `${window.location.origin}${AUTH_CALLBACK_PATH}`
      : `http://localhost:5173${AUTH_CALLBACK_PATH}`;

  const redirectUrl = configuredRedirect
    ? normalizeRedirectUrl(configuredRedirect) ?? new URL(fallbackRedirect)
    : new URL(fallbackRedirect);

  redirectUrl.searchParams.delete("next");
  const safeNextPath = resolveSafeNextPath(nextPath);
  if (safeNextPath !== AUTH_DEFAULT_NEXT_PATH) {
    redirectUrl.searchParams.set("next", safeNextPath);
  }

  return redirectUrl.toString();
}

export function resolveSafeNextPath(nextPath?: string | null): string {
  if (!nextPath) {
    return AUTH_DEFAULT_NEXT_PATH;
  }

  let decoded = nextPath;
  try {
    decoded = decodeURIComponent(nextPath);
  } catch {
    decoded = nextPath;
  }

  const isRelativePath = decoded.startsWith("/") && !decoded.startsWith("//");

  return isRelativePath ? decoded : AUTH_DEFAULT_NEXT_PATH;
}
