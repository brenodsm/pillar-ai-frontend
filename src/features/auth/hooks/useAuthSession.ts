import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { subscribeToAuthChanges } from "../services/azureAuth";

interface AuthSessionState {
  session: Session | null;
  loading: boolean;
}

export function useAuthSession(): AuthSessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hasReceivedFirstAuthEvent = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((_event, nextSession) => {
      setSession(nextSession);

      if (!hasReceivedFirstAuthEvent.current) {
        hasReceivedFirstAuthEvent.current = true;
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { session, loading };
}
