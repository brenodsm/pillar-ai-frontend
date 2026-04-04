import { useState } from "react";
import { C } from "../constants/colors";
import {
  LoginScreen,
  CadastroScreen,
  EsqueciScreen,
  RedefinirScreen,
  VerificacaoScreen,
} from "./auth";
import type { AuthScreen } from "./auth";

export function AuthView() {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [fadeKey, setFadeKey] = useState(0);

  const navigate = (target: AuthScreen) => {
    setFadeKey((k) => k + 1);
    setScreen(target);
  };

  const screens: Record<AuthScreen, React.ReactNode> = {
    login: <LoginScreen />,
    cadastro: <CadastroScreen navigate={navigate} />,
    esqueci: <EsqueciScreen navigate={navigate} />,
    redefinir: <RedefinirScreen navigate={navigate} />,
    verificacao: <VerificacaoScreen navigate={navigate} />,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: C.bg,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        color: C.dark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.6;  transform: scale(1.15); }
        }
        .auth-bg-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>

      <div
        className="auth-bg-circle"
        style={{
          width: 500,
          height: 500,
          top: "-15%",
          right: "-10%",
          background: "radial-gradient(circle, rgba(255,145,20,0.04) 0%, transparent 70%)",
        }}
      />
      <div
        className="auth-bg-circle"
        style={{
          width: 400,
          height: 400,
          bottom: "-10%",
          left: "-8%",
          background: "radial-gradient(circle, rgba(255,200,90,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        key={fadeKey}
        style={{
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.creamDark}`,
          padding: "36px 40px",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
          animation: "fadeIn 0.35s ease",
          position: "relative",
          zIndex: 1,
        }}
      >
        {screens[screen]}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: 11.5,
          color: C.grayLighter,
          position: "relative",
          zIndex: 1,
        }}
      >
        Pillar AI · Rottas Construtora &copy; {new Date().getFullYear()} · Inteligencia que sustenta suas decisoes
      </div>
    </div>
  );
}
