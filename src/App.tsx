import { useMemo } from "react";
import PillarAI from "./PillarAI";
import { AuthView } from "./views/AuthView";
import { AuthCallbackScreen } from "./views/auth/AuthCallbackScreen";
import { AuthStatusScreen } from "./views/auth/AuthStatusScreen";
import { useAuthSession } from "./features/auth/hooks/useAuthSession";
import { sessionToSessionUser } from "./features/auth/utils/sessionUser";
import { AUTH_CALLBACK_PATH } from "./features/auth/constants";
import { signOutFromAzure } from "./features/auth/services/azureAuth";

export default function App() {
  const { session, loading } = useAuthSession();
  const user = useMemo(() => sessionToSessionUser(session), [session]);
  const isAuthCallbackRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith(AUTH_CALLBACK_PATH);

  const handleLogout = async () => {
    try {
      await signOutFromAzure();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Falha ao encerrar sessao:", error);
    }
  };

  if (isAuthCallbackRoute) {
    return <AuthCallbackScreen />;
  }

  if (loading) {
    return <AuthStatusScreen title="Carregando…" message="Restaurando sessao ativa." />;
  }

  if (!user) {
    return <AuthView />;
  }

  return <PillarAI onLogout={handleLogout} user={user} />;
}
