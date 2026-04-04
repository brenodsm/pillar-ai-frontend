import { useState } from "react";
import { C } from "../../constants/colors";
import {
  AuthHeader, Divider, Link, SSOButton,
  TextInput, PasswordInput, StrengthBar, PrimaryButton,
  CheckIcon,
} from "../../components/auth";
import { signInWithAzure } from "../../features/auth/services/azureAuth";
import { getAuthErrorMessage } from "../../features/auth/errors";
import type { AuthScreen } from "./types";

export function CadastroScreen({ navigate }: { navigate: (s: AuthScreen) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSsoSubmitting, setIsSsoSubmitting] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  const canSubmit = name && email.includes("@") && password.length >= 8 && password === confirmPw && agreed;

  const handleSubmit = () => {
    if (!canSubmit) return;
    navigate("verificacao");
  };

  const handleSsoSubmit = async () => {
    if (isSsoSubmitting) {
      return;
    }

    setSsoError(null);
    setIsSsoSubmitting(true);

    try {
      await signInWithAzure("/");
    } catch (error) {
      setSsoError(getAuthErrorMessage(error, "Nao foi possivel iniciar o login com Microsoft."));
      setIsSsoSubmitting(false);
    }
  };

  return (
    <>
      <AuthHeader subtitle="Crie sua conta para acessar o Pillar AI. Apenas e-mails corporativos sao aceitos." />
      <SSOButton onClick={handleSsoSubmit} loading={isSsoSubmitting} />
      {ssoError && (
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
          {ssoError}
        </p>
      )}
      <Divider />
      <TextInput label="Nome completo" placeholder="Seu nome completo" value={name} onChange={setName} autoFocus />
      <TextInput label="E-mail corporativo" type="email" placeholder="seunome@rottasconstrutora.com.br" value={email} onChange={setEmail} />
      <PasswordInput label="Senha" placeholder="Minimo 8 caracteres" value={password} onChange={setPassword} />
      <StrengthBar password={password} />
      <PasswordInput label="Confirmar senha" placeholder="Repita a senha" value={confirmPw} onChange={setConfirmPw} />
      {confirmPw && confirmPw !== password && (
        <div style={{ fontSize: 12, color: C.redStop, marginTop: -10, marginBottom: 12 }}>
          As senhas nao coincidem
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 22 }}>
        <div
          onClick={() => setAgreed(!agreed)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            border: `1.5px solid ${agreed ? C.orange : C.creamDark}`,
            background: agreed ? C.orange : "transparent",
            flexShrink: 0,
            marginTop: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "border-color 0.2s ease, background 0.2s ease",
          }}
        >
          {agreed && <CheckIcon size={12} color={C.white} />}
        </div>
        <span style={{ fontSize: 12.5, color: C.grayLight, lineHeight: 1.5 }}>
          Concordo com os{" "}
          <Link onClick={() => {}}>Termos de Uso</Link> e{" "}
          <Link onClick={() => {}}>Politica de Privacidade</Link>
        </span>
      </div>

      <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
        Criar conta
      </PrimaryButton>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: C.grayLight }}>
        Ja tem uma conta?{" "}
        <Link onClick={() => navigate("login")}>Fazer login</Link>
      </div>
    </>
  );
}
