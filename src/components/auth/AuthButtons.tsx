import { useState } from "react";
import { C } from "../../constants/colors";
import { MicrosoftIcon } from "./AuthIcons";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  variant = "filled",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "filled" | "outline";
}) {
  const [pressed, setPressed] = useState(false);
  const isFilled = variant === "filled";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: "100%",
        height: 50,
        border: isFilled ? "none" : `1.5px solid rgba(255,145,20,0.3)`,
        borderRadius: 12,
        background: isFilled
          ? `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`
          : C.white,
        color: isFilled ? C.white : C.orange,
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        boxShadow: isFilled ? "0 4px 18px rgba(255,145,20,0.3)" : "none",
        letterSpacing: "0.01em",
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {children}
    </button>
  );
}

export function SSOButton({
  onClick,
  disabled = false,
  loading = false,
  loadingLabel = "Conectando…",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: 50,
        border: `1.5px solid ${hovered && !isDisabled ? C.orange : C.creamDark}`,
        borderRadius: 12,
        background: hovered && !isDisabled ? "rgba(255,145,20,0.03)" : C.white,
        color: C.dark,
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 600,
        cursor: isDisabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "border-color 0.2s ease, background 0.2s ease, opacity 0.2s ease",
        opacity: isDisabled ? 0.7 : 1,
      }}
    >
      <MicrosoftIcon />
      <span>{loading ? loadingLabel : "Entrar com Microsoft"}</span>
    </button>
  );
}
