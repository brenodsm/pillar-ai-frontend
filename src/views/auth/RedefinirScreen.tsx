import { useState } from "react";
import { C } from "../../constants/colors";
import {
  AuthHeader, BackLink,
  PasswordInput, StrengthBar, PrimaryButton,
  LockIcon, CheckCircleIcon,
} from "../../components/auth";
import type { AuthScreen } from "./types";

export function RedefinirScreen({ navigate }: { navigate: (s: AuthScreen) => void }) {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = password.length >= 8 && password === confirmPw;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSuccess(true);
    setTimeout(() => navigate("login"), 2500);
  };

  return (
    <>
      <BackLink onClick={() => navigate("login")} />

      {success ? (
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(46,170,92,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 22px",
            }}
          >
            <CheckCircleIcon size={52} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
            Senha redefinida!
          </h2>
          <p style={{ fontSize: 13.5, color: C.grayLight, lineHeight: 1.6 }}>
            Voce sera redirecionado para o login em instantes...
          </p>
        </div>
      ) : (
        <>
          <AuthHeader
            icon={<LockIcon />}
            subtitle="Crie uma nova senha para sua conta. Ela deve ter no minimo 8 caracteres."
          />
          <div style={{ textAlign: "center", marginTop: -12, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: 0, letterSpacing: "-0.01em" }}>
              Redefinir senha
            </h2>
          </div>
          <PasswordInput label="Nova senha" placeholder="Minimo 8 caracteres" value={password} onChange={setPassword} />
          <StrengthBar password={password} />
          <PasswordInput label="Confirmar nova senha" placeholder="Repita a nova senha" value={confirmPw} onChange={setConfirmPw} />
          {confirmPw && confirmPw !== password && (
            <div style={{ fontSize: 12, color: C.redStop, marginTop: -10, marginBottom: 12 }}>
              As senhas nao coincidem
            </div>
          )}
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
            Redefinir senha
          </PrimaryButton>
        </>
      )}
    </>
  );
}
