import { useEffect, useRef, useState } from "react";
import { exchangeCodeForSession } from "../../features/auth/services/azureAuth";
import { getAuthErrorMessage } from "../../features/auth/errors";
import { resolveSafeNextPath } from "../../features/auth/utils/navigation";
import { AuthStatusScreen } from "./AuthStatusScreen";

export function AuthCallbackScreen() {
  const hasHandledRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (hasHandledRef.current) {
      return;
    }

    hasHandledRef.current = true;

    const handleCallback = async () => {
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get("code");
      const nextPath = resolveSafeNextPath(currentUrl.searchParams.get("next"));
      const oauthError = currentUrl.searchParams.get("error_description") ?? currentUrl.searchParams.get("error");

      if (oauthError) {
        let parsedMessage = oauthError;
        try {
          parsedMessage = decodeURIComponent(oauthError);
        } catch {
          parsedMessage = oauthError;
        }

        setStatus("error");
        setErrorMessage(parsedMessage);
        return;
      }

      if (!code) {
        window.location.replace(nextPath);
        return;
      }

      try {
        await exchangeCodeForSession(code);
        window.location.replace(nextPath);
      } catch (error) {
        setStatus("error");
        setErrorMessage(getAuthErrorMessage(error, "Falha ao concluir autenticacao com Microsoft."));
      }
    };

    void handleCallback();
  }, []);

  if (status === "error") {
    return (
      <AuthStatusScreen
        title="Falha na autenticacao"
        message={`${errorMessage} Recarregue a pagina e tente novamente.`}
        tone="error"
      />
    );
  }

  return <AuthStatusScreen title="Autenticando…" message="Concluindo login com Microsoft e preparando sua sessao." />;
}
