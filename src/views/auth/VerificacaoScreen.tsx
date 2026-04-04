import { useState } from "react";
import { C } from "../../constants/colors";
import { CheckCircleIcon, Link, PrimaryButton } from "../../components/auth";
import type { AuthScreen } from "./types";

export function VerificacaoScreen({ navigate }: { navigate: (s: AuthScreen) => void }) {
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div style={{ textAlign: "center", paddingTop: 12 }}>
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
        Verifique seu e-mail
      </h2>
      <p style={{ fontSize: 13.5, color: C.grayLight, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 24px" }}>
        Enviamos um link de confirmacao para
        <br />
        <strong style={{ color: C.dark }}>seu-email@rottasconstrutora.com.br</strong>
      </p>
      <div
        style={{
          background: C.bg,
          border: `1.5px dashed ${C.creamDark}`,
          borderRadius: 14,
          padding: 20,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: C.orange,
                opacity: 0.25,
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: C.grayLight, lineHeight: 1.6, margin: 0 }}>
          Abra o e-mail e clique no botao de confirmacao para ativar sua conta.
        </p>
      </div>
      <PrimaryButton variant="outline" onClick={handleResend}>
        {resent ? "E-mail reenviado!" : "Reenviar e-mail"}
      </PrimaryButton>
      <div style={{ marginTop: 20, fontSize: 13, color: C.grayLight }}>
        Ja confirmou?{" "}
        <Link onClick={() => navigate("login")}>Fazer login</Link>
      </div>
    </div>
  );
}
