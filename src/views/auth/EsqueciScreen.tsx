import { useState } from "react";
import { C } from "../../constants/colors";
import {
  AuthHeader, BackLink, Link,
  TextInput, PrimaryButton,
  MailIcon, CheckCircleIcon,
} from "../../components/auth";
import type { AuthScreen } from "./types";

export function EsqueciScreen({ navigate }: { navigate: (s: AuthScreen) => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!email.includes("@")) return;
    setSent(true);
  };

  return (
    <>
      <BackLink onClick={() => navigate("login")} />
      <AuthHeader
        icon={<MailIcon />}
        subtitle={
          sent
            ? "Se o e-mail estiver cadastrado, voce recebera um link de recuperacao em instantes."
            : "Informe seu e-mail corporativo e enviaremos um link para redefinir sua senha."
        }
      />
      {!sent && (
        <div style={{ textAlign: "center", marginTop: -12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
            Esqueceu sua senha?
          </h2>
        </div>
      )}

      {sent ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(46,170,92,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircleIcon size={36} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 6 }}>E-mail enviado!</p>
          <p style={{ fontSize: 13, color: C.grayLight, lineHeight: 1.6, marginBottom: 24 }}>
            Verifique sua caixa de entrada e spam.
            <br />O link e valido por 30 minutos.
          </p>
          <PrimaryButton variant="outline" onClick={() => navigate("login")}>
            Voltar ao login
          </PrimaryButton>
        </div>
      ) : (
        <>
          <TextInput
            label="E-mail corporativo"
            type="email"
            placeholder="seunome@rottasconstrutora.com.br"
            value={email}
            onChange={setEmail}
            autoFocus
          />
          <PrimaryButton onClick={handleSubmit}>Enviar link de recuperacao</PrimaryButton>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: C.grayLighter, lineHeight: 1.6 }}>
            O link sera valido por 30 minutos.
            <br />
            Verifique tambem a pasta de spam.
          </div>
        </>
      )}
    </>
  );
}
