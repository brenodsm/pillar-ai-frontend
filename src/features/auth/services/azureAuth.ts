import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { AUTH_DEFAULT_NEXT_PATH } from "../constants";
import { resolveAuthRedirectTo } from "../utils/navigation";

export async function signInWithAzure(nextPath = AUTH_DEFAULT_NEXT_PATH): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      scopes: "email",
      redirectTo: resolveAuthRedirectTo(nextPath),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    throw error;
  }

  return data;
}

export async function signOutFromAzure(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export function subscribeToAuthChanges(
  onChange: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => onChange(event, session));

  return () => subscription.unsubscribe();
}
