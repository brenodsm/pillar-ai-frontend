import type { Session } from "@supabase/supabase-js";
import type { SessionUser } from "../../../types";

function readDisplayName(session: Session): string {
  const metadata = session.user.user_metadata;
  const candidates = [
    metadata?.display_name,
    metadata?.full_name,
    metadata?.name,
    metadata?.preferred_username,
    session.user.email,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "Usuario";
}

export function sessionToSessionUser(session: Session | null): SessionUser | null {
  if (!session) {
    return null;
  }

  const email = session.user.email?.trim();
  if (!email) {
    return null;
  }

  return {
    email,
    display_name: readDisplayName(session),
  };
}
