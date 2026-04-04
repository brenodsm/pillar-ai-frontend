import { C } from "../../constants/colors";
import { AuthHeader } from "../../components/auth";

interface AuthStatusScreenProps {
  title: string;
  message: string;
  tone?: "neutral" | "error";
}

export function AuthStatusScreen({ title, message, tone = "neutral" }: AuthStatusScreenProps) {
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
      <div
        style={{
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.creamDark}`,
          padding: "36px 40px",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <AuthHeader subtitle={message} />
        <div style={{ textAlign: "center", marginTop: -6 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: tone === "error" ? C.redStop : C.dark,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h2>
        </div>
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
