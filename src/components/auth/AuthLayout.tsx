import { C } from "../../constants/colors";
import { RottasLogo } from "../RottasLogo";
import { ArrowLeftIcon } from "./AuthIcons";

export function AuthHeader({ subtitle, icon }: { subtitle: string; icon?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      {icon ? (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(255,145,20,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          {icon}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <RottasLogo size={38} />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.dark,
              letterSpacing: "-0.02em",
            }}
          >
            Pillar <span style={{ color: C.orange }}>AI</span>
          </div>
        </div>
      )}
      <p
        style={{
          fontSize: 13.5,
          color: C.grayLight,
          lineHeight: 1.6,
          maxWidth: 340,
          margin: "0 auto",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

export function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.creamDark }} />
      <span style={{ fontSize: 12, color: C.grayLighter, fontWeight: 500 }}>ou</span>
      <div style={{ flex: 1, height: 1, background: C.creamDark }} />
    </div>
  );
}

export function Link({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        color: C.orange,
        textDecoration: "none",
        fontWeight: 600,
        fontSize: "inherit",
        cursor: "pointer",
      }}
    >
      {children}
    </span>
  );
}

export function BackLink({ onClick, children = "Voltar ao login" }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: C.grayLight,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        marginBottom: 24,
      }}
    >
      <ArrowLeftIcon />
      {children}
    </span>
  );
}
