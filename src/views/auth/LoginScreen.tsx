import { useState } from "react";
import { C } from "../../constants/colors";
import { AuthHeader, SSOButton } from "../../components/auth";
import { signInWithAzure } from "../../features/auth/services/azureAuth";
import { getAuthErrorMessage } from "../../features/auth/errors";

export function LoginScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithAzure("/");
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Nao foi possivel iniciar o login com Microsoft."));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AuthHeader subtitle="Acesse a plataforma de gestão inteligente de reuniões da Rottas Construtora." />
      <SSOButton onClick={handleLogin} loading={isSubmitting} />
      {error && (
        <p
          role="alert"
          style={{
            marginTop: 14,
            marginBottom: 0,
            color: C.redStop,
            fontSize: 12.5,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </>
  );
}
